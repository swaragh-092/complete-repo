--
-- PostgreSQL database cluster dump
--

\restrict U43d6klyV6VuU4mYzqrfx2c1u9jzH2BtMXVUrMP6DkkOAcBCRmfxNCaLlnjwOdd

SET default_transaction_read_only = off;

SET client_encoding = 'UTF8';
SET standard_conforming_strings = on;

--
-- Roles
--

CREATE ROLE postgres;
ALTER ROLE postgres WITH SUPERUSER INHERIT CREATEROLE CREATEDB LOGIN REPLICATION BYPASSRLS PASSWORD 'SCRAM-SHA-256$4096:FS3LA9OwOgi9cqtOm3qo+Q==$3+UZ3uqB3vMbqlET058WZ/1NK0+lwh+RMBtHez5BsZQ=:+CvPqkdNfWNfsnDO28LDIKvFg9pSXE4+vGWgPbkJy2A=';

--
-- User Configurations
--








\unrestrict U43d6klyV6VuU4mYzqrfx2c1u9jzH2BtMXVUrMP6DkkOAcBCRmfxNCaLlnjwOdd

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

\restrict ZYcK25DihEb8UyuduphT8kjE8Bsj1K4mgvUOu512O4rqAs5frhj9s75FOZ3t8eZ

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

\unrestrict ZYcK25DihEb8UyuduphT8kjE8Bsj1K4mgvUOu512O4rqAs5frhj9s75FOZ3t8eZ

--
-- Database "email_service" dump
--

--
-- PostgreSQL database dump
--

\restrict hSJzmTJwWp2mgENwxY76efHNHqrSMrbsxXpDLnHlXmTh6MAYvzk3CjgPg7yey9C

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
-- Name: email_service; Type: DATABASE; Schema: -; Owner: postgres
--

CREATE DATABASE email_service WITH TEMPLATE = template0 ENCODING = 'UTF8' LOCALE_PROVIDER = libc LOCALE = 'en_US.utf8';


ALTER DATABASE email_service OWNER TO postgres;

\unrestrict hSJzmTJwWp2mgENwxY76efHNHqrSMrbsxXpDLnHlXmTh6MAYvzk3CjgPg7yey9C
\connect email_service
\restrict hSJzmTJwWp2mgENwxY76efHNHqrSMrbsxXpDLnHlXmTh6MAYvzk3CjgPg7yey9C

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
-- Name: enum_email_logs_status; Type: TYPE; Schema: public; Owner: postgres
--

CREATE TYPE public.enum_email_logs_status AS ENUM (
    'queued',
    'sending',
    'sent',
    'failed'
);


ALTER TYPE public.enum_email_logs_status OWNER TO postgres;

SET default_tablespace = '';

SET default_table_access_method = heap;

--
-- Name: email_logs; Type: TABLE; Schema: public; Owner: postgres
--

CREATE TABLE public.email_logs (
    id uuid NOT NULL,
    type character varying(255) NOT NULL,
    "to" character varying(255) NOT NULL,
    subject character varying(255),
    status public.enum_email_logs_status DEFAULT 'queued'::public.enum_email_logs_status NOT NULL,
    attempts integer DEFAULT 0 NOT NULL,
    sent_at timestamp with time zone,
    failed_at timestamp with time zone,
    error text,
    message_id character varying(255),
    metadata jsonb,
    created_at timestamp with time zone DEFAULT now() NOT NULL,
    updated_at timestamp with time zone DEFAULT now() NOT NULL,
    scope character varying(20) DEFAULT 'system'::character varying NOT NULL,
    org_id uuid,
    user_id uuid,
    client_key character varying(50),
    service_name character varying(50),
    CONSTRAINT chk_email_logs_scope CHECK (((scope)::text = ANY ((ARRAY['system'::character varying, 'organization'::character varying, 'user'::character varying])::text[])))
);


ALTER TABLE public.email_logs OWNER TO postgres;

--
-- Name: COLUMN email_logs.type; Type: COMMENT; Schema: public; Owner: postgres
--

COMMENT ON COLUMN public.email_logs.type IS 'Email type (CLIENT_REQUEST, CLIENT_APPROVED, etc.)';


--
-- Name: COLUMN email_logs."to"; Type: COMMENT; Schema: public; Owner: postgres
--

COMMENT ON COLUMN public.email_logs."to" IS 'Recipient email address';


--
-- Name: COLUMN email_logs.subject; Type: COMMENT; Schema: public; Owner: postgres
--

COMMENT ON COLUMN public.email_logs.subject IS 'Rendered email subject line';


--
-- Name: COLUMN email_logs.error; Type: COMMENT; Schema: public; Owner: postgres
--

COMMENT ON COLUMN public.email_logs.error IS 'Error message if sending failed';


--
-- Name: COLUMN email_logs.message_id; Type: COMMENT; Schema: public; Owner: postgres
--

COMMENT ON COLUMN public.email_logs.message_id IS 'SMTP message ID returned by provider';


--
-- Name: COLUMN email_logs.metadata; Type: COMMENT; Schema: public; Owner: postgres
--

COMMENT ON COLUMN public.email_logs.metadata IS 'Template data and extra context';


--
-- Name: sequelize_meta; Type: TABLE; Schema: public; Owner: postgres
--

CREATE TABLE public.sequelize_meta (
    name character varying(255) NOT NULL
);


ALTER TABLE public.sequelize_meta OWNER TO postgres;

--
-- Data for Name: email_logs; Type: TABLE DATA; Schema: public; Owner: postgres
--

COPY public.email_logs (id, type, "to", subject, status, attempts, sent_at, failed_at, error, message_id, metadata, created_at, updated_at, scope, org_id, user_id, client_key, service_name) FROM stdin;
\.


--
-- Data for Name: sequelize_meta; Type: TABLE DATA; Schema: public; Owner: postgres
--

COPY public.sequelize_meta (name) FROM stdin;
20260214000001-create-email-logs.js
20260217000001-add-tracking-columns.js
\.


--
-- Name: email_logs email_logs_pkey; Type: CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.email_logs
    ADD CONSTRAINT email_logs_pkey PRIMARY KEY (id);


--
-- Name: sequelize_meta sequelize_meta_pkey; Type: CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.sequelize_meta
    ADD CONSTRAINT sequelize_meta_pkey PRIMARY KEY (name);


--
-- Name: email_logs_client_key; Type: INDEX; Schema: public; Owner: postgres
--

CREATE INDEX email_logs_client_key ON public.email_logs USING btree (client_key);


--
-- Name: email_logs_created_at; Type: INDEX; Schema: public; Owner: postgres
--

CREATE INDEX email_logs_created_at ON public.email_logs USING btree (created_at);


--
-- Name: email_logs_org_id; Type: INDEX; Schema: public; Owner: postgres
--

CREATE INDEX email_logs_org_id ON public.email_logs USING btree (org_id);


--
-- Name: email_logs_scope; Type: INDEX; Schema: public; Owner: postgres
--

CREATE INDEX email_logs_scope ON public.email_logs USING btree (scope);


--
-- Name: email_logs_scope_org_id; Type: INDEX; Schema: public; Owner: postgres
--

CREATE INDEX email_logs_scope_org_id ON public.email_logs USING btree (scope, org_id);


--
-- Name: email_logs_service_name_type; Type: INDEX; Schema: public; Owner: postgres
--

CREATE INDEX email_logs_service_name_type ON public.email_logs USING btree (service_name, type);


--
-- Name: email_logs_status; Type: INDEX; Schema: public; Owner: postgres
--

CREATE INDEX email_logs_status ON public.email_logs USING btree (status);


--
-- Name: email_logs_to; Type: INDEX; Schema: public; Owner: postgres
--

CREATE INDEX email_logs_to ON public.email_logs USING btree ("to");


--
-- Name: email_logs_type; Type: INDEX; Schema: public; Owner: postgres
--

CREATE INDEX email_logs_type ON public.email_logs USING btree (type);


--
-- Name: email_logs_user_id; Type: INDEX; Schema: public; Owner: postgres
--

CREATE INDEX email_logs_user_id ON public.email_logs USING btree (user_id);


--
-- PostgreSQL database dump complete
--

\unrestrict hSJzmTJwWp2mgENwxY76efHNHqrSMrbsxXpDLnHlXmTh6MAYvzk3CjgPg7yey9C

--
-- Database "postgres" dump
--

\connect postgres

--
-- PostgreSQL database dump
--

\restrict JIsnJFo4n5FvCYTtEwp6tzGZ5I7BnJbCVisQA5HMLGTyXrKZzXzGgiTh7SaCZa9

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

\unrestrict JIsnJFo4n5FvCYTtEwp6tzGZ5I7BnJbCVisQA5HMLGTyXrKZzXzGgiTh7SaCZa9

--
-- PostgreSQL database cluster dump complete
--

