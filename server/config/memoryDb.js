/**
 * In-memory database with Supabase-compatible chainable API.
 * Used as a fallback when Supabase is unreachable.
 */

const store = {};

function getTable(name) {
  if (!store[name]) store[name] = [];
  return store[name];
}

function matchesFilters(row, filters) {
  return filters.every(({ col, val }) => row[col] === val);
}

// Deep clone to avoid mutation
function clone(obj) {
  return JSON.parse(JSON.stringify(obj));
}

let idCounter = 1;

function generateId() {
  return `mem_${Date.now()}_${idCounter++}`;
}

class QueryBuilder {
  constructor(tableName) {
    this._table = tableName;
    this._filters = [];
    this._orderCol = null;
    this._orderAsc = true;
    this._rangeFrom = null;
    this._rangeTo = null;
    this._limitVal = null;
    this._selectCols = '*';
    this._operation = null; // select, insert, update, upsert, delete
    this._payload = null;
    this._countOnly = false;
    this._headOnly = false;
    this._wantSingle = false;
    this._selectSpec = null;
    this._returnData = false;
  }

  select(cols, opts) {
    // If select() is called after insert/update/upsert, it means "return the result"
    if (!this._operation) {
      this._operation = 'select';
    }
    this._selectCols = cols || '*';
    this._returnData = true;
    if (opts && opts.count === 'exact') this._countOnly = true;
    if (opts && opts.head) this._headOnly = true;
    this._selectSpec = cols;
    return this;
  }

  insert(data) {
    this._operation = 'insert';
    this._payload = Array.isArray(data) ? data : [data];
    return this;
  }

  update(data) {
    this._operation = 'update';
    this._payload = data;
    return this;
  }

  upsert(data) {
    this._operation = 'upsert';
    this._payload = Array.isArray(data) ? data : [data];
    return this;
  }

  delete() {
    this._operation = 'delete';
    return this;
  }

  eq(col, val) {
    this._filters.push({ col, val });
    return this;
  }

  order(col, opts) {
    this._orderCol = col;
    this._orderAsc = opts ? opts.ascending !== false : true;
    return this;
  }

  range(from, to) {
    this._rangeFrom = from;
    this._rangeTo = to;
    return this;
  }

  limit(n) {
    this._limitVal = n;
    return this;
  }

  single() {
    this._wantSingle = true;
    return this._execute();
  }

  // When the chain ends without .single(), we need to resolve.
  // Supabase queries are thenable, so we implement .then()
  then(resolve, reject) {
    try {
      const result = this._execute();
      resolve(result);
    } catch (e) {
      if (reject) reject(e);
    }
  }

  _execute() {
    const table = getTable(this._table);

    switch (this._operation) {
      case 'select': return this._doSelect(table);
      case 'insert': return this._doInsert(table);
      case 'update': return this._doUpdate(table);
      case 'upsert': return this._doUpsert(table);
      case 'delete': return this._doDelete(table);
      default: return { data: null, error: null };
    }
  }

  _doSelect(table) {
    let rows = table.filter(r => matchesFilters(r, this._filters));

    // Handle joined selects by resolving references
    rows = rows.map(r => this._resolveJoins(clone(r)));

    if (this._orderCol) {
      rows.sort((a, b) => {
        const va = a[this._orderCol];
        const vb = b[this._orderCol];
        if (va < vb) return this._orderAsc ? -1 : 1;
        if (va > vb) return this._orderAsc ? 1 : -1;
        return 0;
      });
    }

    if (this._rangeFrom !== null && this._rangeTo !== null) {
      rows = rows.slice(this._rangeFrom, this._rangeTo + 1);
    }

    if (this._limitVal !== null) {
      rows = rows.slice(0, this._limitVal);
    }

    if (this._headOnly && this._countOnly) {
      return { data: null, count: rows.length, error: null };
    }

    if (this._countOnly) {
      return { data: rows, count: rows.length, error: null };
    }

    if (this._wantSingle) {
      if (rows.length === 0) {
        return { data: null, error: { message: 'No rows found', code: 'PGRST116' } };
      }
      return { data: rows[0], error: null };
    }

    return { data: rows, error: null };
  }

  _resolveJoins(row) {
    // For select patterns like:
    // '*, host:users!rooms_host_id_fkey(id, name, avatar_url)'
    // '*, users:user_id(name, avatar_url)'
    // 'user:users(id, name, avatar_url), is_host, is_ready'
    // 'room_id, room:rooms(id, room_name, status)'
    if (!this._selectSpec || this._selectSpec === '*') return row;

    const joinPattern = /(\w+):(\w+)(?:!\w+)?\(([^)]+)\)/g;
    let match;
    while ((match = joinPattern.exec(this._selectSpec)) !== null) {
      const alias = match[1];
      const foreignTable = match[2];
      const fields = match[3].split(',').map(f => f.trim());

      // Try to find the foreign key
      const fkCol = `${alias}_id` in row ? `${alias}_id` :
                     `${foreignTable.replace(/s$/, '')}_id` in row ? `${foreignTable.replace(/s$/, '')}_id` :
                     'user_id' in row && foreignTable === 'users' ? 'user_id' :
                     'host_id' in row && alias === 'host' ? 'host_id' :
                     'room_id' in row && foreignTable === 'rooms' ? 'room_id' :
                     null;

      if (fkCol && row[fkCol]) {
        const foreignRows = getTable(foreignTable);
        const foreignRow = foreignRows.find(fr => fr.id === row[fkCol]);
        if (foreignRow) {
          const picked = {};
          fields.forEach(f => { if (f in foreignRow) picked[f] = foreignRow[f]; });
          row[alias] = picked;
        } else {
          row[alias] = null;
        }
      } else {
        // For count aggregations like members:room_members(count)
        if (fields.length === 1 && fields[0] === 'count') {
          const relatedTable = getTable(foreignTable);
          const relatedCol = this._table === 'rooms' ? 'room_id' : 'user_id';
          const count = relatedTable.filter(r => r[relatedCol] === row.id).length;
          row[alias] = [{ count }];
        } else {
          row[alias] = null;
        }
      }
    }

    return row;
  }

  _doInsert(table) {
    const inserted = [];
    for (const item of this._payload) {
      const row = clone(item);
      if (!row.id) row.id = generateId();
      if (!row.created_at) row.created_at = new Date().toISOString();
      table.push(row);
      inserted.push(clone(row));
    }

    // If .select() was chained after insert
    if (this._selectCols) {
      if (this._wantSingle) {
        return { data: inserted[0] || null, error: null };
      }
      return { data: inserted, error: null };
    }
    return { data: inserted, error: null };
  }

  _doUpdate(table) {
    const updated = [];
    for (let i = 0; i < table.length; i++) {
      if (matchesFilters(table[i], this._filters)) {
        Object.assign(table[i], this._payload);
        table[i].updated_at = new Date().toISOString();
        updated.push(clone(table[i]));
      }
    }

    if (this._wantSingle) {
      return { data: updated[0] || null, error: null };
    }
    return { data: updated, error: null };
  }

  _doUpsert(table) {
    const results = [];
    for (const item of this._payload) {
      const row = clone(item);
      // Try to find existing by id or user_id
      const key = row.id ? 'id' : row.user_id ? 'user_id' : null;
      let existing = null;
      if (key) {
        existing = table.find(r => r[key] === row[key]);
      }

      if (existing) {
        Object.assign(existing, row);
        existing.updated_at = new Date().toISOString();
        results.push(clone(existing));
      } else {
        if (!row.id) row.id = generateId();
        if (!row.created_at) row.created_at = new Date().toISOString();
        table.push(row);
        results.push(clone(row));
      }
    }

    if (this._wantSingle) {
      return { data: results[0] || null, error: null };
    }
    return { data: results, error: null };
  }

  _doDelete(table) {
    const tableRef = getTable(this._table);
    const before = tableRef.length;
    const remaining = tableRef.filter(r => !matchesFilters(r, this._filters));
    store[this._table] = remaining;
    return { data: null, error: null, count: before - remaining.length };
  }
}

// Supabase-compatible client interface
const memoryClient = {
  from(tableName) {
    return new QueryBuilder(tableName);
  }
};

export default memoryClient;
