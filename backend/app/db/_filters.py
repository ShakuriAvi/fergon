"""Helpers to assemble parameterized list/search/pagination SQL (#26).

The column names, table names and search columns passed here are **always
hardcoded constants from the ``queries`` modules — never user input** — so it is
safe to interpolate them into the SQL fragment. Every *value* (the search term,
limit, offset and any extra filters) is passed as a bound parameter, so the
assembled SQL is not vulnerable to injection.
"""
from __future__ import annotations

from typing import Any, Iterable


def build_list_sql(
    *,
    columns: str,
    from_clause: str,
    order_by: str,
    search_columns: Iterable[str] = (),
    q: str | None = None,
    include_inactive: bool = False,
    has_is_active: bool = True,
    active_column: str = "is_active",
    limit: int,
    offset: int,
    extra_where: list[str] | None = None,
    extra_params: dict[str, Any] | None = None,
) -> tuple[str, str, dict[str, Any], dict[str, Any]]:
    """Return ``(list_sql, count_sql, list_params, count_params)``.

    ``list_sql`` adds ``ORDER BY``/``LIMIT``/``OFFSET``; ``count_sql`` shares the
    same ``WHERE`` so ``total`` reflects the filter (ignoring pagination).
    """
    where: list[str] = []
    params: dict[str, Any] = dict(extra_params or {})
    if extra_where:
        where.extend(extra_where)
    if has_is_active and not include_inactive:
        where.append(f"{active_column} = 1")
    search_columns = tuple(search_columns)
    if q and search_columns:
        like = " OR ".join(f"{col} LIKE :q" for col in search_columns)
        where.append(f"({like})")
        params["q"] = f"%{q}%"

    where_sql = (" WHERE " + " AND ".join(where)) if where else ""
    list_sql = (
        f"SELECT {columns} FROM {from_clause}{where_sql} "
        f"ORDER BY {order_by} LIMIT :limit OFFSET :offset"
    )
    count_sql = f"SELECT COUNT(*) AS n FROM {from_clause}{where_sql}"
    list_params = {**params, "limit": limit, "offset": offset}
    return list_sql, count_sql, params, list_params
