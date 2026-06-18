"""Centralized raw-SQL statements for the whole application.

Per project preference we write plain SQL instead of building queries through the
SQLAlchemy ORM (no ``session.query(Model).filter(...)``). Every statement used by
the db layer / services lives here as a named, parameterized constant; callers
run them with ``session.execute(text(...), params)`` so values are always bound,
never interpolated.

Statements use named bind params (``:name``) and stick to syntax that works on
both MySQL (prod) and SQLite (tests). The reserved word ``key`` is wrapped in
backticks, which both dialects accept.
"""
