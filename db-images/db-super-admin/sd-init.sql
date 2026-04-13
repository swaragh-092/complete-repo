--
-- PostgreSQL database cluster dump
--

\restrict t6Uer6AaU9NJQk4jVa1QnjrFaiADQL7ZUO3O4BGBu6tBjzYhqxBN1EahieqIVss

SET default_transaction_read_only = off;

SET client_encoding = 'UTF8';
SET standard_conforming_strings = on;

--
-- Roles
--

CREATE ROLE postgres;
ALTER ROLE postgres WITH SUPERUSER INHERIT CREATEROLE CREATEDB LOGIN REPLICATION BYPASSRLS PASSWORD 'SCRAM-SHA-256$4096:up4Pm02wQR9HVCcBU8LbMA==$B008oJe+Q9ajSxQzZUuaRThTvu1ptb+MDRtgugf7euE=:P5b6epzn1U7X3Mf2elXDYlYGuaebn/d1L5wSHkDWx5I=';

--
-- User Configurations
--








\unrestrict t6Uer6AaU9NJQk4jVa1QnjrFaiADQL7ZUO3O4BGBu6tBjzYhqxBN1EahieqIVss

--
-- Databases
--

--
-- Database "template1" dump
--

\connect template1

--
-- PostgreSQL database dump
--

\restrict ZUxdOnRUjs0mngPGVcTXzSiSrbFOseElcgysqulYZ3wVGx3dHZei7ckYzdPRPJP

-- Dumped from database version 16.13 (Debian 16.13-1.pgdg13+1)
-- Dumped by pg_dump version 16.13 (Debian 16.13-1.pgdg13+1)

SET statement_timeout = 0;
SET lock_timeout = 0;
SET idle_in_transaction_session_timeout = 0;
SET client_encoding = 'UTF8';
SET standard_conforming_strings = on;
SELECT pg_catalog.set_config('search_path', '', false);
SET check_function_bodies = false;
SET xmloption = content;
SET client_min_messages = warning;
SET row_security = off;

--
-- PostgreSQL database dump complete
--

\unrestrict ZUxdOnRUjs0mngPGVcTXzSiSrbFOseElcgysqulYZ3wVGx3dHZei7ckYzdPRPJP

--
-- Database "postgres" dump
--

\connect postgres

--
-- PostgreSQL database dump
--

\restrict iWndUOzzhYL3OmgteJELdZ0aywW58pLgiPCeHwjlhoOozgj2ugIaQytcBYtW9yD

-- Dumped from database version 16.13 (Debian 16.13-1.pgdg13+1)
-- Dumped by pg_dump version 16.13 (Debian 16.13-1.pgdg13+1)

SET statement_timeout = 0;
SET lock_timeout = 0;
SET idle_in_transaction_session_timeout = 0;
SET client_encoding = 'UTF8';
SET standard_conforming_strings = on;
SELECT pg_catalog.set_config('search_path', '', false);
SET check_function_bodies = false;
SET xmloption = content;
SET client_min_messages = warning;
SET row_security = off;

--
-- PostgreSQL database dump complete
--

\unrestrict iWndUOzzhYL3OmgteJELdZ0aywW58pLgiPCeHwjlhoOozgj2ugIaQytcBYtW9yD

--
-- Database "super_administrator" dump
--

--
-- PostgreSQL database dump
--

\restrict yiD4me2NS7r2guVBa14RRGhPv9XqJD4xDWW6myBx3mhuhPYmWq3YSUoe6uVxoLQ

-- Dumped from database version 16.13 (Debian 16.13-1.pgdg13+1)
-- Dumped by pg_dump version 16.13 (Debian 16.13-1.pgdg13+1)

SET statement_timeout = 0;
SET lock_timeout = 0;
SET idle_in_transaction_session_timeout = 0;
SET client_encoding = 'UTF8';
SET standard_conforming_strings = on;
SELECT pg_catalog.set_config('search_path', '', false);
SET check_function_bodies = false;
SET xmloption = content;
SET client_min_messages = warning;
SET row_security = off;

--
-- Name: super_administrator; Type: DATABASE; Schema: -; Owner: postgres
--

CREATE DATABASE super_administrator WITH TEMPLATE = template0 ENCODING = 'UTF8' LOCALE_PROVIDER = libc LOCALE = 'en_US.utf8';


ALTER DATABASE super_administrator OWNER TO postgres;

\unrestrict yiD4me2NS7r2guVBa14RRGhPv9XqJD4xDWW6myBx3mhuhPYmWq3YSUoe6uVxoLQ
\connect super_administrator
\restrict yiD4me2NS7r2guVBa14RRGhPv9XqJD4xDWW6myBx3mhuhPYmWq3YSUoe6uVxoLQ

SET statement_timeout = 0;
SET lock_timeout = 0;
SET idle_in_transaction_session_timeout = 0;
SET client_encoding = 'UTF8';
SET standard_conforming_strings = on;
SELECT pg_catalog.set_config('search_path', '', false);
SET check_function_bodies = false;
SET xmloption = content;
SET client_min_messages = warning;
SET row_security = off;

--
-- PostgreSQL database dump complete
--

\unrestrict yiD4me2NS7r2guVBa14RRGhPv9XqJD4xDWW6myBx3mhuhPYmWq3YSUoe6uVxoLQ

--
-- PostgreSQL database cluster dump complete
--

