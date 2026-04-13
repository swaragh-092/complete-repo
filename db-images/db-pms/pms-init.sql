--
-- PostgreSQL database cluster dump
--

\restrict 3wlXaJEnEdUXK1ijFvSZ3ObpGLgyMflPecfbrcw2T6s5l1UlFQ3ksSwSPh65UNA

SET default_transaction_read_only = off;

SET client_encoding = 'UTF8';
SET standard_conforming_strings = on;

--
-- Roles
--

CREATE ROLE postgres;
ALTER ROLE postgres WITH SUPERUSER INHERIT CREATEROLE CREATEDB LOGIN REPLICATION BYPASSRLS PASSWORD 'SCRAM-SHA-256$4096:RMkO6Hy4CsejWV561Lhgig==$iwfAjlJ/PwGAphlvCQgp85hAOTLb/vnSLnPFrF/1gV4=:FCBKCM4BPpl5ZfAbdZ7eEj6EZxFTXbWK3B06fri8GfM=';

--
-- User Configurations
--








\unrestrict 3wlXaJEnEdUXK1ijFvSZ3ObpGLgyMflPecfbrcw2T6s5l1UlFQ3ksSwSPh65UNA

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

\restrict 2Kb28efmm5WhLJll6EceAPKineauEfwI3DZhYUMewDfUGVF5RI4CHKWBLp0H2Yc

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

\unrestrict 2Kb28efmm5WhLJll6EceAPKineauEfwI3DZhYUMewDfUGVF5RI4CHKWBLp0H2Yc

--
-- Database "pms_v2" dump
--

--
-- PostgreSQL database dump
--

\restrict sBc7dupx92QP9lvhmtOdutnlxjLbHzs713j1ZRp0cT0ml0xT4FvZncLqF59ugkS

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
-- Name: pms_v2; Type: DATABASE; Schema: -; Owner: postgres
--

CREATE DATABASE pms_v2 WITH TEMPLATE = template0 ENCODING = 'UTF8' LOCALE_PROVIDER = libc LOCALE = 'en_US.utf8';


ALTER DATABASE pms_v2 OWNER TO postgres;

\unrestrict sBc7dupx92QP9lvhmtOdutnlxjLbHzs713j1ZRp0cT0ml0xT4FvZncLqF59ugkS
\connect pms_v2
\restrict sBc7dupx92QP9lvhmtOdutnlxjLbHzs713j1ZRp0cT0ml0xT4FvZncLqF59ugkS

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
-- Name: enum_pms_audit_logs_action; Type: TYPE; Schema: public; Owner: postgres
--

CREATE TYPE public.enum_pms_audit_logs_action AS ENUM (
    'create',
    'update',
    'delete',
    'bulk_create',
    'bulk_update',
    'bulk_delete'
);


ALTER TYPE public.enum_pms_audit_logs_action OWNER TO postgres;

--
-- Name: enum_pms_boards_type; Type: TYPE; Schema: public; Owner: postgres
--

CREATE TYPE public.enum_pms_boards_type AS ENUM (
    'kanban',
    'scrum'
);


ALTER TYPE public.enum_pms_boards_type OWNER TO postgres;

--
-- Name: enum_pms_entity_labels_entity_type; Type: TYPE; Schema: public; Owner: postgres
--

CREATE TYPE public.enum_pms_entity_labels_entity_type AS ENUM (
    'issue',
    'user_story',
    'feature'
);


ALTER TYPE public.enum_pms_entity_labels_entity_type OWNER TO postgres;

--
-- Name: enum_pms_features_priority; Type: TYPE; Schema: public; Owner: postgres
--

CREATE TYPE public.enum_pms_features_priority AS ENUM (
    'low',
    'medium',
    'high',
    'critical'
);


ALTER TYPE public.enum_pms_features_priority OWNER TO postgres;

--
-- Name: enum_pms_features_status; Type: TYPE; Schema: public; Owner: postgres
--

CREATE TYPE public.enum_pms_features_status AS ENUM (
    'active',
    'inactive'
);


ALTER TYPE public.enum_pms_features_status OWNER TO postgres;

--
-- Name: enum_pms_issue_histories_action_type; Type: TYPE; Schema: public; Owner: postgres
--

CREATE TYPE public.enum_pms_issue_histories_action_type AS ENUM (
    'created',
    'accepted',
    'rejected',
    'reassigned',
    'fixed',
    'resolved',
    'commented',
    're_opened',
    'updated',
    'status_change',
    'assigned'
);


ALTER TYPE public.enum_pms_issue_histories_action_type OWNER TO postgres;

--
-- Name: enum_pms_issue_statuses_category; Type: TYPE; Schema: public; Owner: postgres
--

CREATE TYPE public.enum_pms_issue_statuses_category AS ENUM (
    'todo',
    'in_progress',
    'done'
);


ALTER TYPE public.enum_pms_issue_statuses_category OWNER TO postgres;

--
-- Name: enum_pms_issues_priority; Type: TYPE; Schema: public; Owner: postgres
--

CREATE TYPE public.enum_pms_issues_priority AS ENUM (
    'low',
    'medium',
    'high',
    'critical'
);


ALTER TYPE public.enum_pms_issues_priority OWNER TO postgres;

--
-- Name: enum_pms_issues_status; Type: TYPE; Schema: public; Owner: postgres
--

CREATE TYPE public.enum_pms_issues_status AS ENUM (
    'open',
    're_open',
    'in_progress',
    'resolved',
    'closed',
    'reject'
);


ALTER TYPE public.enum_pms_issues_status OWNER TO postgres;

--
-- Name: enum_pms_notifications_entity_type; Type: TYPE; Schema: public; Owner: postgres
--

CREATE TYPE public.enum_pms_notifications_entity_type AS ENUM (
    'task',
    'issue',
    'project',
    'feature',
    'user_story'
);


ALTER TYPE public.enum_pms_notifications_entity_type OWNER TO postgres;

--
-- Name: enum_pms_notifications_scope; Type: TYPE; Schema: public; Owner: postgres
--

CREATE TYPE public.enum_pms_notifications_scope AS ENUM (
    'individual',
    'project',
    'department',
    'project_department'
);


ALTER TYPE public.enum_pms_notifications_scope OWNER TO postgres;

--
-- Name: enum_pms_project_features_status; Type: TYPE; Schema: public; Owner: postgres
--

CREATE TYPE public.enum_pms_project_features_status AS ENUM (
    'pending',
    'in_progress',
    'completed'
);


ALTER TYPE public.enum_pms_project_features_status OWNER TO postgres;

--
-- Name: enum_pms_project_members_project_role; Type: TYPE; Schema: public; Owner: postgres
--

CREATE TYPE public.enum_pms_project_members_project_role AS ENUM (
    'member',
    'lead',
    'viewer',
    'tester'
);


ALTER TYPE public.enum_pms_project_members_project_role OWNER TO postgres;

--
-- Name: enum_pms_projects_visibility; Type: TYPE; Schema: public; Owner: postgres
--

CREATE TYPE public.enum_pms_projects_visibility AS ENUM (
    'public',
    'private',
    'restricted'
);


ALTER TYPE public.enum_pms_projects_visibility OWNER TO postgres;

--
-- Name: enum_pms_sprints_status; Type: TYPE; Schema: public; Owner: postgres
--

CREATE TYPE public.enum_pms_sprints_status AS ENUM (
    'planned',
    'active',
    'completed'
);


ALTER TYPE public.enum_pms_sprints_status OWNER TO postgres;

--
-- Name: enum_pms_story_change_requests_request_type; Type: TYPE; Schema: public; Owner: postgres
--

CREATE TYPE public.enum_pms_story_change_requests_request_type AS ENUM (
    'due_date_change',
    'status_revert'
);


ALTER TYPE public.enum_pms_story_change_requests_request_type OWNER TO postgres;

--
-- Name: enum_pms_story_change_requests_status; Type: TYPE; Schema: public; Owner: postgres
--

CREATE TYPE public.enum_pms_story_change_requests_status AS ENUM (
    'pending',
    'approved',
    'rejected'
);


ALTER TYPE public.enum_pms_story_change_requests_status OWNER TO postgres;

--
-- Name: enum_pms_tasks_live_status; Type: TYPE; Schema: public; Owner: postgres
--

CREATE TYPE public.enum_pms_tasks_live_status AS ENUM (
    'running',
    'stop'
);


ALTER TYPE public.enum_pms_tasks_live_status OWNER TO postgres;

--
-- Name: enum_pms_tasks_priority; Type: TYPE; Schema: public; Owner: postgres
--

CREATE TYPE public.enum_pms_tasks_priority AS ENUM (
    'low',
    'medium',
    'high',
    'critical'
);


ALTER TYPE public.enum_pms_tasks_priority OWNER TO postgres;

--
-- Name: enum_pms_tasks_status; Type: TYPE; Schema: public; Owner: postgres
--

CREATE TYPE public.enum_pms_tasks_status AS ENUM (
    'approve_pending',
    'approved',
    'in_progress',
    'completed',
    'blocked',
    'assign_pending',
    'checklist_removed',
    'accept_pending',
    'reject'
);


ALTER TYPE public.enum_pms_tasks_status OWNER TO postgres;

--
-- Name: enum_pms_tasks_task_for; Type: TYPE; Schema: public; Owner: postgres
--

CREATE TYPE public.enum_pms_tasks_task_for AS ENUM (
    'normal',
    'issue',
    'checklist',
    'help'
);


ALTER TYPE public.enum_pms_tasks_task_for OWNER TO postgres;

--
-- Name: enum_pms_user_stories_approval_status; Type: TYPE; Schema: public; Owner: postgres
--

CREATE TYPE public.enum_pms_user_stories_approval_status AS ENUM (
    'pending',
    'approved',
    'rejected',
    'not_required'
);


ALTER TYPE public.enum_pms_user_stories_approval_status OWNER TO postgres;

--
-- Name: enum_pms_user_stories_live_status; Type: TYPE; Schema: public; Owner: postgres
--

CREATE TYPE public.enum_pms_user_stories_live_status AS ENUM (
    'running',
    'stop'
);


ALTER TYPE public.enum_pms_user_stories_live_status OWNER TO postgres;

--
-- Name: enum_pms_user_stories_priority; Type: TYPE; Schema: public; Owner: postgres
--

CREATE TYPE public.enum_pms_user_stories_priority AS ENUM (
    'low',
    'medium',
    'high',
    'critical'
);


ALTER TYPE public.enum_pms_user_stories_priority OWNER TO postgres;

--
-- Name: enum_pms_user_stories_status; Type: TYPE; Schema: public; Owner: postgres
--

CREATE TYPE public.enum_pms_user_stories_status AS ENUM (
    'defined',
    'in_progress',
    'completed',
    'blocked',
    'review',
    'accept_pending',
    'reject'
);


ALTER TYPE public.enum_pms_user_stories_status OWNER TO postgres;

--
-- Name: enum_pms_user_stories_story_for; Type: TYPE; Schema: public; Owner: postgres
--

CREATE TYPE public.enum_pms_user_stories_story_for AS ENUM (
    'normal',
    'help'
);


ALTER TYPE public.enum_pms_user_stories_story_for OWNER TO postgres;

--
-- Name: enum_pms_user_stories_type; Type: TYPE; Schema: public; Owner: postgres
--

CREATE TYPE public.enum_pms_user_stories_type AS ENUM (
    'story',
    'task'
);


ALTER TYPE public.enum_pms_user_stories_type OWNER TO postgres;

SET default_tablespace = '';

SET default_table_access_method = heap;

--
-- Name: SequelizeMeta; Type: TABLE; Schema: public; Owner: postgres
--

CREATE TABLE public."SequelizeMeta" (
    name character varying(255) NOT NULL
);


ALTER TABLE public."SequelizeMeta" OWNER TO postgres;

--
-- Name: pms_audit_logs; Type: TABLE; Schema: public; Owner: postgres
--

CREATE TABLE public.pms_audit_logs (
    id uuid NOT NULL,
    reference_id uuid,
    table_name character varying(255) NOT NULL,
    snapshot json NOT NULL,
    updated_columns json,
    remarks character varying(255),
    organization_id uuid NOT NULL,
    action public.enum_pms_audit_logs_action NOT NULL,
    user_id character varying(255) NOT NULL,
    user_agent character varying(45),
    ip_address character varying(45),
    "time" timestamp with time zone DEFAULT now() NOT NULL
);


ALTER TABLE public.pms_audit_logs OWNER TO postgres;

--
-- Name: pms_board_columns; Type: TABLE; Schema: public; Owner: postgres
--

CREATE TABLE public.pms_board_columns (
    id uuid NOT NULL,
    board_id uuid NOT NULL,
    name character varying(255) NOT NULL,
    "position" integer DEFAULT 0 NOT NULL,
    mapped_status_ids json,
    created_at timestamp with time zone DEFAULT CURRENT_TIMESTAMP NOT NULL,
    updated_at timestamp with time zone DEFAULT CURRENT_TIMESTAMP NOT NULL,
    deleted_at timestamp with time zone,
    organization_id uuid,
    created_by uuid,
    updated_by uuid,
    created_ip character varying(45),
    updated_ip character varying(45),
    created_user_agent character varying(255),
    updated_user_agent character varying(255)
);


ALTER TABLE public.pms_board_columns OWNER TO postgres;

--
-- Name: COLUMN pms_board_columns.mapped_status_ids; Type: COMMENT; Schema: public; Owner: postgres
--

COMMENT ON COLUMN public.pms_board_columns.mapped_status_ids IS 'Array of IssueStatus IDs mapped to this column';


--
-- Name: pms_boards; Type: TABLE; Schema: public; Owner: postgres
--

CREATE TABLE public.pms_boards (
    id uuid NOT NULL,
    project_id uuid NOT NULL,
    name character varying(255) DEFAULT 'Default Board'::character varying NOT NULL,
    type public.enum_pms_boards_type DEFAULT 'kanban'::public.enum_pms_boards_type,
    created_at timestamp with time zone DEFAULT CURRENT_TIMESTAMP NOT NULL,
    updated_at timestamp with time zone DEFAULT CURRENT_TIMESTAMP NOT NULL,
    deleted_at timestamp with time zone,
    organization_id uuid,
    created_by uuid,
    updated_by uuid,
    created_ip character varying(45),
    updated_ip character varying(45),
    created_user_agent character varying(255),
    updated_user_agent character varying(255)
);


ALTER TABLE public.pms_boards OWNER TO postgres;

--
-- Name: pms_entity_labels; Type: TABLE; Schema: public; Owner: postgres
--

CREATE TABLE public.pms_entity_labels (
    id uuid NOT NULL,
    label_id uuid NOT NULL,
    entity_id uuid NOT NULL,
    entity_type public.enum_pms_entity_labels_entity_type NOT NULL,
    created_at timestamp with time zone DEFAULT CURRENT_TIMESTAMP,
    updated_at timestamp with time zone DEFAULT CURRENT_TIMESTAMP,
    organization_id uuid,
    created_by uuid,
    updated_by uuid,
    created_ip character varying(45),
    updated_ip character varying(45),
    created_user_agent character varying(255),
    updated_user_agent character varying(255),
    deleted_at timestamp with time zone
);


ALTER TABLE public.pms_entity_labels OWNER TO postgres;

--
-- Name: COLUMN pms_entity_labels.entity_id; Type: COMMENT; Schema: public; Owner: postgres
--

COMMENT ON COLUMN public.pms_entity_labels.entity_id IS 'ID of Issue, UserStory, or Feature';


--
-- Name: pms_features; Type: TABLE; Schema: public; Owner: postgres
--

CREATE TABLE public.pms_features (
    id uuid NOT NULL,
    department_id uuid NOT NULL,
    name character varying(100) NOT NULL,
    description character varying(255),
    status public.enum_pms_features_status DEFAULT 'active'::public.enum_pms_features_status NOT NULL,
    organization_id uuid,
    created_by uuid,
    updated_by uuid,
    created_ip character varying(45),
    updated_ip character varying(45),
    created_user_agent character varying(255),
    updated_user_agent character varying(255),
    created_at timestamp with time zone DEFAULT CURRENT_TIMESTAMP NOT NULL,
    updated_at timestamp with time zone DEFAULT CURRENT_TIMESTAMP NOT NULL,
    deleted_at timestamp with time zone,
    project_id uuid,
    parent_feature_id uuid,
    assignee_id uuid,
    priority public.enum_pms_features_priority DEFAULT 'medium'::public.enum_pms_features_priority,
    status_id uuid
);


ALTER TABLE public.pms_features OWNER TO postgres;

--
-- Name: COLUMN pms_features.parent_feature_id; Type: COMMENT; Schema: public; Owner: postgres
--

COMMENT ON COLUMN public.pms_features.parent_feature_id IS 'Hierarchy for Sub-Features';


--
-- Name: pms_issue_attachments; Type: TABLE; Schema: public; Owner: postgres
--

CREATE TABLE public.pms_issue_attachments (
    id uuid NOT NULL,
    issue_id uuid NOT NULL,
    user_id uuid NOT NULL,
    file_name character varying(255) NOT NULL,
    file_path character varying(255) NOT NULL,
    file_type character varying(255),
    file_size integer,
    created_at timestamp with time zone DEFAULT CURRENT_TIMESTAMP NOT NULL,
    updated_at timestamp with time zone DEFAULT CURRENT_TIMESTAMP NOT NULL,
    deleted_at timestamp with time zone,
    organization_id uuid,
    created_by uuid,
    updated_by uuid,
    created_ip character varying(45),
    updated_ip character varying(45),
    created_user_agent character varying(255),
    updated_user_agent character varying(255)
);


ALTER TABLE public.pms_issue_attachments OWNER TO postgres;

--
-- Name: COLUMN pms_issue_attachments.user_id; Type: COMMENT; Schema: public; Owner: postgres
--

COMMENT ON COLUMN public.pms_issue_attachments.user_id IS 'Uploader ID (from auth-service)';


--
-- Name: pms_issue_comments; Type: TABLE; Schema: public; Owner: postgres
--

CREATE TABLE public.pms_issue_comments (
    id uuid NOT NULL,
    issue_id uuid NOT NULL,
    user_id uuid NOT NULL,
    content text NOT NULL,
    created_at timestamp with time zone DEFAULT CURRENT_TIMESTAMP NOT NULL,
    updated_at timestamp with time zone DEFAULT CURRENT_TIMESTAMP NOT NULL,
    deleted_at timestamp with time zone,
    organization_id uuid,
    created_by uuid,
    updated_by uuid,
    created_ip character varying(45),
    updated_ip character varying(45),
    created_user_agent character varying(255),
    updated_user_agent character varying(255)
);


ALTER TABLE public.pms_issue_comments OWNER TO postgres;

--
-- Name: COLUMN pms_issue_comments.user_id; Type: COMMENT; Schema: public; Owner: postgres
--

COMMENT ON COLUMN public.pms_issue_comments.user_id IS 'Reference to auth-service user (no FK)';


--
-- Name: pms_issue_histories; Type: TABLE; Schema: public; Owner: postgres
--

CREATE TABLE public.pms_issue_histories (
    id uuid NOT NULL,
    issue_id uuid NOT NULL,
    user_id uuid NOT NULL,
    action_type public.enum_pms_issue_histories_action_type NOT NULL,
    comment text,
    organization_id uuid,
    created_by uuid,
    updated_by uuid,
    created_ip character varying(45),
    updated_ip character varying(45),
    created_user_agent character varying(255),
    updated_user_agent character varying(255),
    created_at timestamp with time zone DEFAULT CURRENT_TIMESTAMP NOT NULL,
    updated_at timestamp with time zone DEFAULT CURRENT_TIMESTAMP NOT NULL,
    deleted_at timestamp with time zone
);


ALTER TABLE public.pms_issue_histories OWNER TO postgres;

--
-- Name: pms_issue_labels; Type: TABLE; Schema: public; Owner: postgres
--

CREATE TABLE public.pms_issue_labels (
    id uuid NOT NULL,
    project_id uuid NOT NULL,
    name character varying(50) NOT NULL,
    color character varying(20) DEFAULT '#000000'::character varying,
    created_at timestamp with time zone DEFAULT CURRENT_TIMESTAMP,
    updated_at timestamp with time zone DEFAULT CURRENT_TIMESTAMP,
    deleted_at timestamp with time zone,
    organization_id uuid,
    created_by uuid,
    updated_by uuid,
    created_ip character varying(45),
    updated_ip character varying(45),
    created_user_agent character varying(255),
    updated_user_agent character varying(255)
);


ALTER TABLE public.pms_issue_labels OWNER TO postgres;

--
-- Name: pms_issue_stats; Type: TABLE; Schema: public; Owner: postgres
--

CREATE TABLE public.pms_issue_stats (
    id uuid NOT NULL,
    user_id uuid NOT NULL,
    issue_type_id uuid NOT NULL,
    count integer DEFAULT 0 NOT NULL,
    organization_id uuid,
    created_by uuid,
    updated_by uuid,
    created_ip character varying(45),
    updated_ip character varying(45),
    created_user_agent character varying(255),
    updated_user_agent character varying(255),
    created_at timestamp with time zone DEFAULT CURRENT_TIMESTAMP NOT NULL,
    updated_at timestamp with time zone DEFAULT CURRENT_TIMESTAMP NOT NULL,
    deleted_at timestamp with time zone
);


ALTER TABLE public.pms_issue_stats OWNER TO postgres;

--
-- Name: pms_issue_statuses; Type: TABLE; Schema: public; Owner: postgres
--

CREATE TABLE public.pms_issue_statuses (
    id uuid NOT NULL,
    project_id uuid,
    name character varying(50) NOT NULL,
    category public.enum_pms_issue_statuses_category DEFAULT 'todo'::public.enum_pms_issue_statuses_category NOT NULL,
    color character varying(20) DEFAULT '#808080'::character varying,
    "position" integer DEFAULT 0,
    created_at timestamp with time zone DEFAULT CURRENT_TIMESTAMP,
    updated_at timestamp with time zone DEFAULT CURRENT_TIMESTAMP,
    deleted_at timestamp with time zone,
    organization_id uuid,
    created_by uuid,
    updated_by uuid,
    created_ip character varying(45),
    updated_ip character varying(45),
    created_user_agent character varying(255),
    updated_user_agent character varying(255)
);


ALTER TABLE public.pms_issue_statuses OWNER TO postgres;

--
-- Name: pms_issue_transitions; Type: TABLE; Schema: public; Owner: postgres
--

CREATE TABLE public.pms_issue_transitions (
    id uuid NOT NULL,
    project_id uuid NOT NULL,
    from_status_id uuid NOT NULL,
    to_status_id uuid NOT NULL,
    created_at timestamp with time zone DEFAULT CURRENT_TIMESTAMP,
    updated_at timestamp with time zone DEFAULT CURRENT_TIMESTAMP,
    organization_id uuid,
    created_by uuid,
    updated_by uuid,
    created_ip character varying(45),
    updated_ip character varying(45),
    created_user_agent character varying(255),
    updated_user_agent character varying(255),
    deleted_at timestamp with time zone
);


ALTER TABLE public.pms_issue_transitions OWNER TO postgres;

--
-- Name: pms_issue_types; Type: TABLE; Schema: public; Owner: postgres
--

CREATE TABLE public.pms_issue_types (
    id uuid NOT NULL,
    name character varying(255) NOT NULL,
    description text,
    organization_id uuid,
    created_by uuid,
    updated_by uuid,
    created_ip character varying(45),
    updated_ip character varying(45),
    created_user_agent character varying(255),
    updated_user_agent character varying(255),
    created_at timestamp with time zone DEFAULT CURRENT_TIMESTAMP NOT NULL,
    updated_at timestamp with time zone DEFAULT CURRENT_TIMESTAMP NOT NULL,
    deleted_at timestamp with time zone,
    hierarchy_level integer DEFAULT 2 NOT NULL
);


ALTER TABLE public.pms_issue_types OWNER TO postgres;

--
-- Name: COLUMN pms_issue_types.hierarchy_level; Type: COMMENT; Schema: public; Owner: postgres
--

COMMENT ON COLUMN public.pms_issue_types.hierarchy_level IS '1=Epic, 2=Story, 3=Task/Subtask';


--
-- Name: pms_issues; Type: TABLE; Schema: public; Owner: postgres
--

CREATE TABLE public.pms_issues (
    id uuid NOT NULL,
    project_id uuid NOT NULL,
    from_department_id uuid NOT NULL,
    to_department_id uuid NOT NULL,
    issue_type_id uuid NOT NULL,
    title character varying(255) NOT NULL,
    description text,
    status public.enum_pms_issues_status DEFAULT 'open'::public.enum_pms_issues_status NOT NULL,
    priority public.enum_pms_issues_priority DEFAULT 'medium'::public.enum_pms_issues_priority NOT NULL,
    organization_id uuid,
    created_by uuid,
    updated_by uuid,
    created_ip character varying(45),
    updated_ip character varying(45),
    created_user_agent character varying(255),
    updated_user_agent character varying(255),
    created_at timestamp with time zone DEFAULT CURRENT_TIMESTAMP NOT NULL,
    updated_at timestamp with time zone DEFAULT CURRENT_TIMESTAMP NOT NULL,
    deleted_at timestamp with time zone,
    user_story_id uuid,
    assignee_id uuid,
    status_id uuid,
    parent_id uuid,
    board_order double precision DEFAULT '65535'::double precision NOT NULL,
    sprint_id uuid
);


ALTER TABLE public.pms_issues OWNER TO postgres;

--
-- Name: pms_notification_reads; Type: TABLE; Schema: public; Owner: postgres
--

CREATE TABLE public.pms_notification_reads (
    id uuid NOT NULL,
    notification_id uuid NOT NULL,
    user_id uuid NOT NULL,
    read_at timestamp with time zone,
    organization_id uuid,
    created_by uuid,
    updated_by uuid,
    created_ip character varying(45),
    updated_ip character varying(45),
    created_user_agent character varying(255),
    updated_user_agent character varying(255),
    created_at timestamp with time zone DEFAULT CURRENT_TIMESTAMP NOT NULL,
    updated_at timestamp with time zone DEFAULT CURRENT_TIMESTAMP NOT NULL,
    deleted_at timestamp with time zone
);


ALTER TABLE public.pms_notification_reads OWNER TO postgres;

--
-- Name: pms_notifications; Type: TABLE; Schema: public; Owner: postgres
--

CREATE TABLE public.pms_notifications (
    id uuid NOT NULL,
    triggered_by_id uuid,
    scope public.enum_pms_notifications_scope NOT NULL,
    entity_type public.enum_pms_notifications_entity_type,
    entity_id uuid,
    user_id uuid,
    project_id uuid,
    department_id uuid,
    title character varying(255) NOT NULL,
    message text,
    read_at timestamp with time zone,
    organization_id uuid,
    created_by uuid,
    updated_by uuid,
    created_ip character varying(45),
    updated_ip character varying(45),
    created_user_agent character varying(255),
    updated_user_agent character varying(255),
    created_at timestamp with time zone DEFAULT CURRENT_TIMESTAMP NOT NULL,
    updated_at timestamp with time zone DEFAULT CURRENT_TIMESTAMP NOT NULL,
    deleted_at timestamp with time zone
);


ALTER TABLE public.pms_notifications OWNER TO postgres;

--
-- Name: pms_project_features; Type: TABLE; Schema: public; Owner: postgres
--

CREATE TABLE public.pms_project_features (
    id uuid NOT NULL,
    project_id uuid NOT NULL,
    feature_id uuid NOT NULL,
    status public.enum_pms_project_features_status DEFAULT 'pending'::public.enum_pms_project_features_status NOT NULL,
    organization_id uuid,
    created_by uuid,
    updated_by uuid,
    created_ip character varying(45),
    updated_ip character varying(45),
    created_user_agent character varying(255),
    updated_user_agent character varying(255),
    created_at timestamp with time zone DEFAULT CURRENT_TIMESTAMP NOT NULL,
    updated_at timestamp with time zone DEFAULT CURRENT_TIMESTAMP NOT NULL,
    deleted_at timestamp with time zone
);


ALTER TABLE public.pms_project_features OWNER TO postgres;

--
-- Name: pms_project_members; Type: TABLE; Schema: public; Owner: postgres
--

CREATE TABLE public.pms_project_members (
    id uuid NOT NULL,
    project_id uuid NOT NULL,
    user_id uuid NOT NULL,
    department_id uuid NOT NULL,
    project_role public.enum_pms_project_members_project_role DEFAULT 'member'::public.enum_pms_project_members_project_role NOT NULL,
    is_active boolean DEFAULT true,
    organization_id uuid,
    created_by uuid,
    updated_by uuid,
    created_ip character varying(45),
    updated_ip character varying(45),
    created_user_agent character varying(255),
    updated_user_agent character varying(255),
    created_at timestamp with time zone DEFAULT CURRENT_TIMESTAMP NOT NULL,
    updated_at timestamp with time zone DEFAULT CURRENT_TIMESTAMP NOT NULL,
    deleted_at timestamp with time zone
);


ALTER TABLE public.pms_project_members OWNER TO postgres;

--
-- Name: pms_projects; Type: TABLE; Schema: public; Owner: postgres
--

CREATE TABLE public.pms_projects (
    id uuid NOT NULL,
    name character varying(100) NOT NULL,
    code character varying(255) NOT NULL,
    description character varying(255),
    start_date timestamp with time zone,
    end_date timestamp with time zone,
    estimated_start_date timestamp with time zone NOT NULL,
    estimated_end_date timestamp with time zone NOT NULL,
    is_completed boolean DEFAULT false NOT NULL,
    visibility public.enum_pms_projects_visibility DEFAULT 'private'::public.enum_pms_projects_visibility NOT NULL,
    organization_id uuid,
    created_by uuid,
    updated_by uuid,
    created_ip character varying(45),
    updated_ip character varying(45),
    created_user_agent character varying(255),
    updated_user_agent character varying(255),
    created_at timestamp with time zone DEFAULT CURRENT_TIMESTAMP NOT NULL,
    updated_at timestamp with time zone DEFAULT CURRENT_TIMESTAMP NOT NULL,
    deleted_at timestamp with time zone
);


ALTER TABLE public.pms_projects OWNER TO postgres;

--
-- Name: pms_sprints; Type: TABLE; Schema: public; Owner: postgres
--

CREATE TABLE public.pms_sprints (
    id uuid NOT NULL,
    project_id uuid NOT NULL,
    name character varying(255) NOT NULL,
    start_date timestamp with time zone,
    end_date timestamp with time zone,
    goal text,
    status public.enum_pms_sprints_status DEFAULT 'planned'::public.enum_pms_sprints_status NOT NULL,
    created_at timestamp with time zone DEFAULT CURRENT_TIMESTAMP NOT NULL,
    updated_at timestamp with time zone DEFAULT CURRENT_TIMESTAMP NOT NULL,
    deleted_at timestamp with time zone,
    organization_id uuid,
    created_by uuid,
    updated_by uuid,
    created_ip character varying(45),
    updated_ip character varying(45),
    created_user_agent character varying(255),
    updated_user_agent character varying(255)
);


ALTER TABLE public.pms_sprints OWNER TO postgres;

--
-- Name: pms_story_change_requests; Type: TABLE; Schema: public; Owner: postgres
--

CREATE TABLE public.pms_story_change_requests (
    id uuid NOT NULL,
    story_id uuid NOT NULL,
    requested_by uuid NOT NULL,
    request_type public.enum_pms_story_change_requests_request_type NOT NULL,
    requested_value json NOT NULL,
    current_value json,
    status public.enum_pms_story_change_requests_status DEFAULT 'pending'::public.enum_pms_story_change_requests_status NOT NULL,
    reviewed_by uuid,
    reviewed_at timestamp with time zone,
    review_comments text,
    created_by uuid,
    updated_by uuid,
    created_at timestamp with time zone DEFAULT now() NOT NULL,
    updated_at timestamp with time zone DEFAULT now() NOT NULL,
    deleted_at timestamp with time zone,
    organization_id uuid,
    created_ip character varying(45),
    updated_ip character varying(45),
    created_user_agent character varying(255),
    updated_user_agent character varying(255)
);


ALTER TABLE public.pms_story_change_requests OWNER TO postgres;

--
-- Name: COLUMN pms_story_change_requests.requested_by; Type: COMMENT; Schema: public; Owner: postgres
--

COMMENT ON COLUMN public.pms_story_change_requests.requested_by IS 'User ID of the person requesting the change';


--
-- Name: COLUMN pms_story_change_requests.requested_value; Type: COMMENT; Schema: public; Owner: postgres
--

COMMENT ON COLUMN public.pms_story_change_requests.requested_value IS 'e.g. { due_date: ''2026-05-01'' } or { target_status: ''defined'' }';


--
-- Name: COLUMN pms_story_change_requests.current_value; Type: COMMENT; Schema: public; Owner: postgres
--

COMMENT ON COLUMN public.pms_story_change_requests.current_value IS 'e.g. { due_date: ''2026-04-01'' } or { current_status: ''in_progress'' }';


--
-- Name: pms_user_stories; Type: TABLE; Schema: public; Owner: postgres
--

CREATE TABLE public.pms_user_stories (
    id uuid NOT NULL,
    project_id uuid NOT NULL,
    feature_id uuid NOT NULL,
    parent_user_story_id uuid,
    department_id uuid NOT NULL,
    title character varying(255) NOT NULL,
    description text,
    acceptance_criteria text,
    priority public.enum_pms_user_stories_priority DEFAULT 'medium'::public.enum_pms_user_stories_priority NOT NULL,
    status public.enum_pms_user_stories_status DEFAULT 'defined'::public.enum_pms_user_stories_status NOT NULL,
    story_points integer,
    due_date date,
    completed_at timestamp with time zone,
    sort_order integer DEFAULT 0 NOT NULL,
    organization_id uuid,
    created_by uuid,
    updated_by uuid,
    created_ip character varying(45),
    updated_ip character varying(45),
    created_user_agent character varying(255),
    updated_user_agent character varying(255),
    created_at timestamp with time zone DEFAULT CURRENT_TIMESTAMP NOT NULL,
    updated_at timestamp with time zone DEFAULT CURRENT_TIMESTAMP NOT NULL,
    deleted_at timestamp with time zone,
    assigned_to uuid,
    assignee uuid,
    total_work_time integer DEFAULT 0 NOT NULL,
    live_status public.enum_pms_user_stories_live_status DEFAULT 'stop'::public.enum_pms_user_stories_live_status,
    taken_at timestamp with time zone,
    type public.enum_pms_user_stories_type DEFAULT 'story'::public.enum_pms_user_stories_type NOT NULL,
    reporter_id uuid,
    approval_status public.enum_pms_user_stories_approval_status DEFAULT 'not_required'::public.enum_pms_user_stories_approval_status,
    approved_by uuid,
    status_id uuid,
    story_for public.enum_pms_user_stories_story_for DEFAULT 'normal'::public.enum_pms_user_stories_story_for NOT NULL,
    helped_for uuid,
    sprint_id uuid,
    backlog_order double precision DEFAULT '65535'::double precision NOT NULL
);


ALTER TABLE public.pms_user_stories OWNER TO postgres;

--
-- Name: COLUMN pms_user_stories.parent_user_story_id; Type: COMMENT; Schema: public; Owner: postgres
--

COMMENT ON COLUMN public.pms_user_stories.parent_user_story_id IS 'Self-referencing FK for sub user stories. NULL means top-level.';


--
-- Name: COLUMN pms_user_stories.assigned_to; Type: COMMENT; Schema: public; Owner: postgres
--

COMMENT ON COLUMN public.pms_user_stories.assigned_to IS 'User assigned to work on this story';


--
-- Name: COLUMN pms_user_stories.assignee; Type: COMMENT; Schema: public; Owner: postgres
--

COMMENT ON COLUMN public.pms_user_stories.assignee IS 'User who assigned the story (e.g. PM)';


--
-- Name: COLUMN pms_user_stories.total_work_time; Type: COMMENT; Schema: public; Owner: postgres
--

COMMENT ON COLUMN public.pms_user_stories.total_work_time IS 'Total time spent in minutes';


--
-- Name: COLUMN pms_user_stories.live_status; Type: COMMENT; Schema: public; Owner: postgres
--

COMMENT ON COLUMN public.pms_user_stories.live_status IS 'Timer status';


--
-- Name: COLUMN pms_user_stories.taken_at; Type: COMMENT; Schema: public; Owner: postgres
--

COMMENT ON COLUMN public.pms_user_stories.taken_at IS 'When work started';


--
-- Name: COLUMN pms_user_stories.type; Type: COMMENT; Schema: public; Owner: postgres
--

COMMENT ON COLUMN public.pms_user_stories.type IS 'Distinguishes between a functional User Story and a technical Task';


--
-- Name: COLUMN pms_user_stories.reporter_id; Type: COMMENT; Schema: public; Owner: postgres
--

COMMENT ON COLUMN public.pms_user_stories.reporter_id IS 'User who reported/created the item';


--
-- Name: pms_user_story_dependencies; Type: TABLE; Schema: public; Owner: postgres
--

CREATE TABLE public.pms_user_story_dependencies (
    id uuid NOT NULL,
    parent_story_id uuid NOT NULL,
    dependency_story_id uuid NOT NULL,
    created_at timestamp with time zone DEFAULT now() NOT NULL,
    updated_at timestamp with time zone DEFAULT now() NOT NULL
);


ALTER TABLE public.pms_user_story_dependencies OWNER TO postgres;

--
-- Name: pms_work_logs; Type: TABLE; Schema: public; Owner: postgres
--

CREATE TABLE public.pms_work_logs (
    id uuid NOT NULL,
    user_id uuid NOT NULL,
    user_story_id uuid,
    project_id uuid NOT NULL,
    feature_id uuid NOT NULL,
    department_id uuid NOT NULL,
    sprint_id uuid,
    start_time timestamp with time zone NOT NULL,
    end_time timestamp with time zone,
    duration_minutes integer,
    log_date date NOT NULL,
    organization_id uuid,
    created_by uuid,
    updated_by uuid,
    created_ip character varying(45),
    updated_ip character varying(45),
    created_user_agent character varying(255),
    updated_user_agent character varying(255),
    created_at timestamp with time zone DEFAULT now() NOT NULL,
    updated_at timestamp with time zone DEFAULT now()
);


ALTER TABLE public.pms_work_logs OWNER TO postgres;

--
-- Name: COLUMN pms_work_logs.user_id; Type: COMMENT; Schema: public; Owner: postgres
--

COMMENT ON COLUMN public.pms_work_logs.user_id IS 'FK → User (from Auth module)';


--
-- Name: COLUMN pms_work_logs.user_story_id; Type: COMMENT; Schema: public; Owner: postgres
--

COMMENT ON COLUMN public.pms_work_logs.user_story_id IS 'FK → pms_user_stories';


--
-- Name: COLUMN pms_work_logs.project_id; Type: COMMENT; Schema: public; Owner: postgres
--

COMMENT ON COLUMN public.pms_work_logs.project_id IS 'FK → pms_projects';


--
-- Name: COLUMN pms_work_logs.feature_id; Type: COMMENT; Schema: public; Owner: postgres
--

COMMENT ON COLUMN public.pms_work_logs.feature_id IS 'FK → pms_features';


--
-- Name: COLUMN pms_work_logs.department_id; Type: COMMENT; Schema: public; Owner: postgres
--

COMMENT ON COLUMN public.pms_work_logs.department_id IS 'Department the work belongs to';


--
-- Name: COLUMN pms_work_logs.sprint_id; Type: COMMENT; Schema: public; Owner: postgres
--

COMMENT ON COLUMN public.pms_work_logs.sprint_id IS 'FK → pms_sprints (nullable)';


--
-- Name: COLUMN pms_work_logs.start_time; Type: COMMENT; Schema: public; Owner: postgres
--

COMMENT ON COLUMN public.pms_work_logs.start_time IS 'When the timer was started';


--
-- Name: COLUMN pms_work_logs.end_time; Type: COMMENT; Schema: public; Owner: postgres
--

COMMENT ON COLUMN public.pms_work_logs.end_time IS 'When the timer was stopped (null = still running)';


--
-- Name: COLUMN pms_work_logs.duration_minutes; Type: COMMENT; Schema: public; Owner: postgres
--

COMMENT ON COLUMN public.pms_work_logs.duration_minutes IS 'Computed on stop: round((end_time - start_time) / 60000)';


--
-- Name: COLUMN pms_work_logs.log_date; Type: COMMENT; Schema: public; Owner: postgres
--

COMMENT ON COLUMN public.pms_work_logs.log_date IS 'Calendar date of start_time (for daily grouping)';


--
-- Data for Name: SequelizeMeta; Type: TABLE DATA; Schema: public; Owner: postgres
--

COPY public."SequelizeMeta" (name) FROM stdin;
20260214081700-create-projects.js
20260214081701-create-features.js
20260214081702-create-project-features.js
20260214081703-create-project-members.js
20260214081704-create-checklists.js
20260214081705-create-issue-types.js
20260214081705-create-issues.js
20260214081722-create-issue-histories.js
20260214081723-create-issue-stats.js
20260214081724-create-tasks.js
20260214081725-create-task-dependencies.js
20260214081726-create-notifications.js
20260214081727-create-notification-reads.js
20260214081728-create-audit-logs.js
20260313000001-fix-project-members-unique-constraint.js
20260316000001-v2-restructure-user-stories.js
20260317000000-cleanup-v2.js
20260317000001-jira-compliance.js
20260317000002-enhanced-issue-tracking.js
20260317000003-update-issue-history-enum.js
20260317000004-add-hierarchy-to-issues.js
20260317000005-create-issue-transitions.js
20260317000006-create-issue-comments.js
20260317000007-create-issue-attachments.js
20260317000008-create-boards.js
20260317000009-create-sprints.js
20260317000010-add-review-to-user-story-status.js
20260318000001-add-common-fields-to-new-tables.js
20260319000001-add-user-story-to-notification-entity-type.js
20260323000001-add-helper-and-dependency-to-user-stories.js
20260323000002-create-user-story-dependencies.js
20260323000003-change-issue-type-default-hierarchy-level.js
20260323000004-fix-existing-issue-type-hierarchy-levels.js
20260323000005-add-tester-role-to-project-member.js
20260324000001-add-sprint-to-user-stories.js
20260327000001-create-story-change-requests.js
20260327000002-add-common-fields-to-story-change-requests.js
20260330000001-create-work-logs.js
\.


--
-- Data for Name: pms_audit_logs; Type: TABLE DATA; Schema: public; Owner: postgres
--

COPY public.pms_audit_logs (id, reference_id, table_name, snapshot, updated_columns, remarks, organization_id, action, user_id, user_agent, ip_address, "time") FROM stdin;
bf9f584e-9223-4778-87c4-8d4ed76f3364	448d118b-0081-4ac4-9f37-1b1350fee8c9	pms_projects	{"id":"448d118b-0081-4ac4-9f37-1b1350fee8c9","is_completed":false,"visibility":"private","created_at":"2026-04-08T09:01:51.247Z","updated_at":"2026-04-08T09:01:51.247Z","name":"Pms","code":"asd","description":"asdf","estimated_start_date":"2026-05-09T00:00:00.000Z","estimated_end_date":"2026-05-10T00:00:00.000Z","updatedAt":"2026-04-08T09:01:51.247Z","createdAt":"2026-04-08T09:01:51.247Z","organization_id":"66c77d80-714f-4f59-ae36-35e22e25219d","created_by":"aca45d51-f738-44aa-8701-9e6a57c18a1b","updated_by":"aca45d51-f738-44aa-8701-9e6a57c18a1b","created_ip":"::ffff:172.18.0.14","updated_ip":"::ffff:172.18.0.14","created_user_agent":"Mozilla/5.0 (X11; Linux x86_64; rv:149.0) Gecko/20100101 Firefox/149.0","updated_user_agent":"Mozilla/5.0 (X11; Linux x86_64; rv:149.0) Gecko/20100101 Firefox/149.0","start_date":null,"end_date":null,"deleted_at":null}	["name","code","description","estimated_start_date","estimated_end_date"]	\N	66c77d80-714f-4f59-ae36-35e22e25219d	create	aca45d51-f738-44aa-8701-9e6a57c18a1b	\N	\N	2026-04-08 09:01:51.28+00
513c22e4-b8f3-4645-ba5a-ca18b45cea86	\N	pms_project_members	[{"id":"1d98bbb6-0bce-431c-abe4-38bae8399338","is_active":true,"project_id":"448d118b-0081-4ac4-9f37-1b1350fee8c9","department_id":"09d36cca-704d-4c22-bb2e-2be499b5fbe1","user_id":"aca45d51-f738-44aa-8701-9e6a57c18a1b","project_role":"member","organization_id":"66c77d80-714f-4f59-ae36-35e22e25219d","created_by":"aca45d51-f738-44aa-8701-9e6a57c18a1b","updated_by":"aca45d51-f738-44aa-8701-9e6a57c18a1b","created_ip":"::ffff:172.18.0.14","updated_ip":"::ffff:172.18.0.14","created_user_agent":"Mozilla/5.0 (X11; Linux x86_64; rv:149.0) Gecko/20100101 Firefox/149.0","updated_user_agent":"Mozilla/5.0 (X11; Linux x86_64; rv:149.0) Gecko/20100101 Firefox/149.0","createdAt":"2026-04-08T09:16:07.851Z","updatedAt":"2026-04-08T09:16:07.851Z","deleted_at":null}]	["project_id","department_id","user_id","project_role"]	\N	812be327-4e00-4e22-94e7-953809fff244	bulk_create	afdasdf	\N	\N	2026-04-08 09:16:07.861+00
bdb8cef4-45cb-411e-a78e-1dbdb2ec37c3	3fa75c8f-b4c3-4a8f-a3fa-d84269b287c1	pms_features	{"id":"3fa75c8f-b4c3-4a8f-a3fa-d84269b287c1","status":"active","priority":"medium","created_at":"2026-04-08T09:16:13.138Z","updated_at":"2026-04-08T09:16:13.138Z","name":"asdf","description":"asdf","department_id":"09d36cca-704d-4c22-bb2e-2be499b5fbe1","project_id":"448d118b-0081-4ac4-9f37-1b1350fee8c9","updatedAt":"2026-04-08T09:16:13.138Z","createdAt":"2026-04-08T09:16:13.138Z","organization_id":"66c77d80-714f-4f59-ae36-35e22e25219d","created_by":"aca45d51-f738-44aa-8701-9e6a57c18a1b","updated_by":"aca45d51-f738-44aa-8701-9e6a57c18a1b","created_ip":"::ffff:172.18.0.14","updated_ip":"::ffff:172.18.0.14","created_user_agent":"Mozilla/5.0 (X11; Linux x86_64; rv:149.0) Gecko/20100101 Firefox/149.0","updated_user_agent":"Mozilla/5.0 (X11; Linux x86_64; rv:149.0) Gecko/20100101 Firefox/149.0","parent_feature_id":null,"status_id":null,"assignee_id":null,"deleted_at":null}	["name","description","department_id","project_id"]	\N	66c77d80-714f-4f59-ae36-35e22e25219d	create	aca45d51-f738-44aa-8701-9e6a57c18a1b	\N	\N	2026-04-08 09:16:13.147+00
\.


--
-- Data for Name: pms_board_columns; Type: TABLE DATA; Schema: public; Owner: postgres
--

COPY public.pms_board_columns (id, board_id, name, "position", mapped_status_ids, created_at, updated_at, deleted_at, organization_id, created_by, updated_by, created_ip, updated_ip, created_user_agent, updated_user_agent) FROM stdin;
\.


--
-- Data for Name: pms_boards; Type: TABLE DATA; Schema: public; Owner: postgres
--

COPY public.pms_boards (id, project_id, name, type, created_at, updated_at, deleted_at, organization_id, created_by, updated_by, created_ip, updated_ip, created_user_agent, updated_user_agent) FROM stdin;
\.


--
-- Data for Name: pms_entity_labels; Type: TABLE DATA; Schema: public; Owner: postgres
--

COPY public.pms_entity_labels (id, label_id, entity_id, entity_type, created_at, updated_at, organization_id, created_by, updated_by, created_ip, updated_ip, created_user_agent, updated_user_agent, deleted_at) FROM stdin;
\.


--
-- Data for Name: pms_features; Type: TABLE DATA; Schema: public; Owner: postgres
--

COPY public.pms_features (id, department_id, name, description, status, organization_id, created_by, updated_by, created_ip, updated_ip, created_user_agent, updated_user_agent, created_at, updated_at, deleted_at, project_id, parent_feature_id, assignee_id, priority, status_id) FROM stdin;
3fa75c8f-b4c3-4a8f-a3fa-d84269b287c1	09d36cca-704d-4c22-bb2e-2be499b5fbe1	asdf	asdf	active	66c77d80-714f-4f59-ae36-35e22e25219d	aca45d51-f738-44aa-8701-9e6a57c18a1b	aca45d51-f738-44aa-8701-9e6a57c18a1b	::ffff:172.18.0.14	::ffff:172.18.0.14	Mozilla/5.0 (X11; Linux x86_64; rv:149.0) Gecko/20100101 Firefox/149.0	Mozilla/5.0 (X11; Linux x86_64; rv:149.0) Gecko/20100101 Firefox/149.0	2026-04-08 09:16:13.138+00	2026-04-08 09:16:13.138+00	\N	448d118b-0081-4ac4-9f37-1b1350fee8c9	\N	\N	medium	\N
\.


--
-- Data for Name: pms_issue_attachments; Type: TABLE DATA; Schema: public; Owner: postgres
--

COPY public.pms_issue_attachments (id, issue_id, user_id, file_name, file_path, file_type, file_size, created_at, updated_at, deleted_at, organization_id, created_by, updated_by, created_ip, updated_ip, created_user_agent, updated_user_agent) FROM stdin;
\.


--
-- Data for Name: pms_issue_comments; Type: TABLE DATA; Schema: public; Owner: postgres
--

COPY public.pms_issue_comments (id, issue_id, user_id, content, created_at, updated_at, deleted_at, organization_id, created_by, updated_by, created_ip, updated_ip, created_user_agent, updated_user_agent) FROM stdin;
\.


--
-- Data for Name: pms_issue_histories; Type: TABLE DATA; Schema: public; Owner: postgres
--

COPY public.pms_issue_histories (id, issue_id, user_id, action_type, comment, organization_id, created_by, updated_by, created_ip, updated_ip, created_user_agent, updated_user_agent, created_at, updated_at, deleted_at) FROM stdin;
\.


--
-- Data for Name: pms_issue_labels; Type: TABLE DATA; Schema: public; Owner: postgres
--

COPY public.pms_issue_labels (id, project_id, name, color, created_at, updated_at, deleted_at, organization_id, created_by, updated_by, created_ip, updated_ip, created_user_agent, updated_user_agent) FROM stdin;
\.


--
-- Data for Name: pms_issue_stats; Type: TABLE DATA; Schema: public; Owner: postgres
--

COPY public.pms_issue_stats (id, user_id, issue_type_id, count, organization_id, created_by, updated_by, created_ip, updated_ip, created_user_agent, updated_user_agent, created_at, updated_at, deleted_at) FROM stdin;
\.


--
-- Data for Name: pms_issue_statuses; Type: TABLE DATA; Schema: public; Owner: postgres
--

COPY public.pms_issue_statuses (id, project_id, name, category, color, "position", created_at, updated_at, deleted_at, organization_id, created_by, updated_by, created_ip, updated_ip, created_user_agent, updated_user_agent) FROM stdin;
550e2d31-9ad3-47cf-8eda-342098ef65cd	448d118b-0081-4ac4-9f37-1b1350fee8c9	To Do	todo	#808080	0	2026-04-08 09:01:51.333+00	2026-04-08 09:01:51.333+00	\N	66c77d80-714f-4f59-ae36-35e22e25219d	aca45d51-f738-44aa-8701-9e6a57c18a1b	aca45d51-f738-44aa-8701-9e6a57c18a1b	::ffff:172.18.0.14	::ffff:172.18.0.14	Mozilla/5.0 (X11; Linux x86_64; rv:149.0) Gecko/20100101 Firefox/149.0	Mozilla/5.0 (X11; Linux x86_64; rv:149.0) Gecko/20100101 Firefox/149.0
b9da20a2-e1a4-4b03-86e0-f4dfd47b4ed5	448d118b-0081-4ac4-9f37-1b1350fee8c9	In Progress	in_progress	#3b82f6	1	2026-04-08 09:01:51.333+00	2026-04-08 09:01:51.333+00	\N	66c77d80-714f-4f59-ae36-35e22e25219d	aca45d51-f738-44aa-8701-9e6a57c18a1b	aca45d51-f738-44aa-8701-9e6a57c18a1b	::ffff:172.18.0.14	::ffff:172.18.0.14	Mozilla/5.0 (X11; Linux x86_64; rv:149.0) Gecko/20100101 Firefox/149.0	Mozilla/5.0 (X11; Linux x86_64; rv:149.0) Gecko/20100101 Firefox/149.0
72ad8032-def4-4bae-a1b2-753480621104	448d118b-0081-4ac4-9f37-1b1350fee8c9	Done	done	#22c55e	2	2026-04-08 09:01:51.333+00	2026-04-08 09:01:51.333+00	\N	66c77d80-714f-4f59-ae36-35e22e25219d	aca45d51-f738-44aa-8701-9e6a57c18a1b	aca45d51-f738-44aa-8701-9e6a57c18a1b	::ffff:172.18.0.14	::ffff:172.18.0.14	Mozilla/5.0 (X11; Linux x86_64; rv:149.0) Gecko/20100101 Firefox/149.0	Mozilla/5.0 (X11; Linux x86_64; rv:149.0) Gecko/20100101 Firefox/149.0
\.


--
-- Data for Name: pms_issue_transitions; Type: TABLE DATA; Schema: public; Owner: postgres
--

COPY public.pms_issue_transitions (id, project_id, from_status_id, to_status_id, created_at, updated_at, organization_id, created_by, updated_by, created_ip, updated_ip, created_user_agent, updated_user_agent, deleted_at) FROM stdin;
\.


--
-- Data for Name: pms_issue_types; Type: TABLE DATA; Schema: public; Owner: postgres
--

COPY public.pms_issue_types (id, name, description, organization_id, created_by, updated_by, created_ip, updated_ip, created_user_agent, updated_user_agent, created_at, updated_at, deleted_at, hierarchy_level) FROM stdin;
\.


--
-- Data for Name: pms_issues; Type: TABLE DATA; Schema: public; Owner: postgres
--

COPY public.pms_issues (id, project_id, from_department_id, to_department_id, issue_type_id, title, description, status, priority, organization_id, created_by, updated_by, created_ip, updated_ip, created_user_agent, updated_user_agent, created_at, updated_at, deleted_at, user_story_id, assignee_id, status_id, parent_id, board_order, sprint_id) FROM stdin;
\.


--
-- Data for Name: pms_notification_reads; Type: TABLE DATA; Schema: public; Owner: postgres
--

COPY public.pms_notification_reads (id, notification_id, user_id, read_at, organization_id, created_by, updated_by, created_ip, updated_ip, created_user_agent, updated_user_agent, created_at, updated_at, deleted_at) FROM stdin;
\.


--
-- Data for Name: pms_notifications; Type: TABLE DATA; Schema: public; Owner: postgres
--

COPY public.pms_notifications (id, triggered_by_id, scope, entity_type, entity_id, user_id, project_id, department_id, title, message, read_at, organization_id, created_by, updated_by, created_ip, updated_ip, created_user_agent, updated_user_agent, created_at, updated_at, deleted_at) FROM stdin;
ed1f038a-a318-43d8-8b98-34742719efc9	aca45d51-f738-44aa-8701-9e6a57c18a1b	individual	project	448d118b-0081-4ac4-9f37-1b1350fee8c9	aca45d51-f738-44aa-8701-9e6a57c18a1b	\N	\N	Added to project	You are added to the Pms.	\N	66c77d80-714f-4f59-ae36-35e22e25219d	aca45d51-f738-44aa-8701-9e6a57c18a1b	aca45d51-f738-44aa-8701-9e6a57c18a1b	::ffff:172.18.0.14	::ffff:172.18.0.14	Mozilla/5.0 (X11; Linux x86_64; rv:149.0) Gecko/20100101 Firefox/149.0	Mozilla/5.0 (X11; Linux x86_64; rv:149.0) Gecko/20100101 Firefox/149.0	2026-04-08 09:16:07.856+00	2026-04-08 09:16:07.856+00	\N
\.


--
-- Data for Name: pms_project_features; Type: TABLE DATA; Schema: public; Owner: postgres
--

COPY public.pms_project_features (id, project_id, feature_id, status, organization_id, created_by, updated_by, created_ip, updated_ip, created_user_agent, updated_user_agent, created_at, updated_at, deleted_at) FROM stdin;
\.


--
-- Data for Name: pms_project_members; Type: TABLE DATA; Schema: public; Owner: postgres
--

COPY public.pms_project_members (id, project_id, user_id, department_id, project_role, is_active, organization_id, created_by, updated_by, created_ip, updated_ip, created_user_agent, updated_user_agent, created_at, updated_at, deleted_at) FROM stdin;
1d98bbb6-0bce-431c-abe4-38bae8399338	448d118b-0081-4ac4-9f37-1b1350fee8c9	aca45d51-f738-44aa-8701-9e6a57c18a1b	09d36cca-704d-4c22-bb2e-2be499b5fbe1	member	t	66c77d80-714f-4f59-ae36-35e22e25219d	aca45d51-f738-44aa-8701-9e6a57c18a1b	aca45d51-f738-44aa-8701-9e6a57c18a1b	::ffff:172.18.0.14	::ffff:172.18.0.14	Mozilla/5.0 (X11; Linux x86_64; rv:149.0) Gecko/20100101 Firefox/149.0	Mozilla/5.0 (X11; Linux x86_64; rv:149.0) Gecko/20100101 Firefox/149.0	2026-04-08 09:16:07.851+00	2026-04-08 09:16:07.851+00	\N
\.


--
-- Data for Name: pms_projects; Type: TABLE DATA; Schema: public; Owner: postgres
--

COPY public.pms_projects (id, name, code, description, start_date, end_date, estimated_start_date, estimated_end_date, is_completed, visibility, organization_id, created_by, updated_by, created_ip, updated_ip, created_user_agent, updated_user_agent, created_at, updated_at, deleted_at) FROM stdin;
448d118b-0081-4ac4-9f37-1b1350fee8c9	Pms	asd	asdf	\N	\N	2026-05-09 00:00:00+00	2026-05-10 00:00:00+00	f	private	66c77d80-714f-4f59-ae36-35e22e25219d	aca45d51-f738-44aa-8701-9e6a57c18a1b	aca45d51-f738-44aa-8701-9e6a57c18a1b	::ffff:172.18.0.14	::ffff:172.18.0.14	Mozilla/5.0 (X11; Linux x86_64; rv:149.0) Gecko/20100101 Firefox/149.0	Mozilla/5.0 (X11; Linux x86_64; rv:149.0) Gecko/20100101 Firefox/149.0	2026-04-08 09:01:51.247+00	2026-04-08 09:01:51.247+00	\N
\.


--
-- Data for Name: pms_sprints; Type: TABLE DATA; Schema: public; Owner: postgres
--

COPY public.pms_sprints (id, project_id, name, start_date, end_date, goal, status, created_at, updated_at, deleted_at, organization_id, created_by, updated_by, created_ip, updated_ip, created_user_agent, updated_user_agent) FROM stdin;
\.


--
-- Data for Name: pms_story_change_requests; Type: TABLE DATA; Schema: public; Owner: postgres
--

COPY public.pms_story_change_requests (id, story_id, requested_by, request_type, requested_value, current_value, status, reviewed_by, reviewed_at, review_comments, created_by, updated_by, created_at, updated_at, deleted_at, organization_id, created_ip, updated_ip, created_user_agent, updated_user_agent) FROM stdin;
\.


--
-- Data for Name: pms_user_stories; Type: TABLE DATA; Schema: public; Owner: postgres
--

COPY public.pms_user_stories (id, project_id, feature_id, parent_user_story_id, department_id, title, description, acceptance_criteria, priority, status, story_points, due_date, completed_at, sort_order, organization_id, created_by, updated_by, created_ip, updated_ip, created_user_agent, updated_user_agent, created_at, updated_at, deleted_at, assigned_to, assignee, total_work_time, live_status, taken_at, type, reporter_id, approval_status, approved_by, status_id, story_for, helped_for, sprint_id, backlog_order) FROM stdin;
\.


--
-- Data for Name: pms_user_story_dependencies; Type: TABLE DATA; Schema: public; Owner: postgres
--

COPY public.pms_user_story_dependencies (id, parent_story_id, dependency_story_id, created_at, updated_at) FROM stdin;
\.


--
-- Data for Name: pms_work_logs; Type: TABLE DATA; Schema: public; Owner: postgres
--

COPY public.pms_work_logs (id, user_id, user_story_id, project_id, feature_id, department_id, sprint_id, start_time, end_time, duration_minutes, log_date, organization_id, created_by, updated_by, created_ip, updated_ip, created_user_agent, updated_user_agent, created_at, updated_at) FROM stdin;
\.


--
-- Name: SequelizeMeta SequelizeMeta_pkey; Type: CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public."SequelizeMeta"
    ADD CONSTRAINT "SequelizeMeta_pkey" PRIMARY KEY (name);


--
-- Name: pms_audit_logs pms_audit_logs_pkey; Type: CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.pms_audit_logs
    ADD CONSTRAINT pms_audit_logs_pkey PRIMARY KEY (id);


--
-- Name: pms_board_columns pms_board_columns_pkey; Type: CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.pms_board_columns
    ADD CONSTRAINT pms_board_columns_pkey PRIMARY KEY (id);


--
-- Name: pms_boards pms_boards_pkey; Type: CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.pms_boards
    ADD CONSTRAINT pms_boards_pkey PRIMARY KEY (id);


--
-- Name: pms_entity_labels pms_entity_labels_pkey; Type: CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.pms_entity_labels
    ADD CONSTRAINT pms_entity_labels_pkey PRIMARY KEY (id);


--
-- Name: pms_features pms_features_department_name_unique; Type: CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.pms_features
    ADD CONSTRAINT pms_features_department_name_unique UNIQUE (department_id, name);


--
-- Name: pms_features pms_features_pkey; Type: CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.pms_features
    ADD CONSTRAINT pms_features_pkey PRIMARY KEY (id);


--
-- Name: pms_issue_attachments pms_issue_attachments_pkey; Type: CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.pms_issue_attachments
    ADD CONSTRAINT pms_issue_attachments_pkey PRIMARY KEY (id);


--
-- Name: pms_issue_comments pms_issue_comments_pkey; Type: CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.pms_issue_comments
    ADD CONSTRAINT pms_issue_comments_pkey PRIMARY KEY (id);


--
-- Name: pms_issue_histories pms_issue_histories_pkey; Type: CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.pms_issue_histories
    ADD CONSTRAINT pms_issue_histories_pkey PRIMARY KEY (id);


--
-- Name: pms_issue_labels pms_issue_labels_pkey; Type: CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.pms_issue_labels
    ADD CONSTRAINT pms_issue_labels_pkey PRIMARY KEY (id);


--
-- Name: pms_issue_stats pms_issue_stats_pkey; Type: CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.pms_issue_stats
    ADD CONSTRAINT pms_issue_stats_pkey PRIMARY KEY (id);


--
-- Name: pms_issue_stats pms_issue_stats_user_type_unique; Type: CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.pms_issue_stats
    ADD CONSTRAINT pms_issue_stats_user_type_unique UNIQUE (user_id, issue_type_id);


--
-- Name: pms_issue_statuses pms_issue_statuses_pkey; Type: CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.pms_issue_statuses
    ADD CONSTRAINT pms_issue_statuses_pkey PRIMARY KEY (id);


--
-- Name: pms_issue_transitions pms_issue_transitions_pkey; Type: CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.pms_issue_transitions
    ADD CONSTRAINT pms_issue_transitions_pkey PRIMARY KEY (id);


--
-- Name: pms_issue_types pms_issue_types_name_key; Type: CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.pms_issue_types
    ADD CONSTRAINT pms_issue_types_name_key UNIQUE (name);


--
-- Name: pms_issue_types pms_issue_types_pkey; Type: CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.pms_issue_types
    ADD CONSTRAINT pms_issue_types_pkey PRIMARY KEY (id);


--
-- Name: pms_issues pms_issues_pkey; Type: CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.pms_issues
    ADD CONSTRAINT pms_issues_pkey PRIMARY KEY (id);


--
-- Name: pms_notification_reads pms_notification_reads_pkey; Type: CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.pms_notification_reads
    ADD CONSTRAINT pms_notification_reads_pkey PRIMARY KEY (id);


--
-- Name: pms_notification_reads pms_notification_reads_reads_notification_user_unique; Type: CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.pms_notification_reads
    ADD CONSTRAINT pms_notification_reads_reads_notification_user_unique UNIQUE (notification_id, user_id);


--
-- Name: pms_notifications pms_notifications_pkey; Type: CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.pms_notifications
    ADD CONSTRAINT pms_notifications_pkey PRIMARY KEY (id);


--
-- Name: pms_project_features pms_project_features_pkey; Type: CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.pms_project_features
    ADD CONSTRAINT pms_project_features_pkey PRIMARY KEY (id);


--
-- Name: pms_project_features pms_project_features_project_feature_unique; Type: CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.pms_project_features
    ADD CONSTRAINT pms_project_features_project_feature_unique UNIQUE (project_id, feature_id);


--
-- Name: pms_project_members pms_project_members_pkey; Type: CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.pms_project_members
    ADD CONSTRAINT pms_project_members_pkey PRIMARY KEY (id);


--
-- Name: pms_project_members pms_project_members_project_user_dept_unique; Type: CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.pms_project_members
    ADD CONSTRAINT pms_project_members_project_user_dept_unique UNIQUE (project_id, user_id, department_id);


--
-- Name: pms_projects pms_projects_code_key; Type: CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.pms_projects
    ADD CONSTRAINT pms_projects_code_key UNIQUE (code);


--
-- Name: pms_projects pms_projects_pkey; Type: CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.pms_projects
    ADD CONSTRAINT pms_projects_pkey PRIMARY KEY (id);


--
-- Name: pms_sprints pms_sprints_pkey; Type: CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.pms_sprints
    ADD CONSTRAINT pms_sprints_pkey PRIMARY KEY (id);


--
-- Name: pms_story_change_requests pms_story_change_requests_pkey; Type: CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.pms_story_change_requests
    ADD CONSTRAINT pms_story_change_requests_pkey PRIMARY KEY (id);


--
-- Name: pms_user_stories pms_user_stories_pkey; Type: CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.pms_user_stories
    ADD CONSTRAINT pms_user_stories_pkey PRIMARY KEY (id);


--
-- Name: pms_user_story_dependencies pms_user_story_dependencies_pkey; Type: CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.pms_user_story_dependencies
    ADD CONSTRAINT pms_user_story_dependencies_pkey PRIMARY KEY (id);


--
-- Name: pms_work_logs pms_work_logs_pkey; Type: CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.pms_work_logs
    ADD CONSTRAINT pms_work_logs_pkey PRIMARY KEY (id);


--
-- Name: pms_entity_labels unique_label_entity; Type: CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.pms_entity_labels
    ADD CONSTRAINT unique_label_entity UNIQUE (label_id, entity_id, entity_type);


--
-- Name: pms_issue_transitions unique_transition; Type: CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.pms_issue_transitions
    ADD CONSTRAINT unique_transition UNIQUE (project_id, from_status_id, to_status_id);


--
-- Name: idx_user_stories_sprint_backlog_order; Type: INDEX; Schema: public; Owner: postgres
--

CREATE INDEX idx_user_stories_sprint_backlog_order ON public.pms_user_stories USING btree (sprint_id, backlog_order);


--
-- Name: idx_user_stories_sprint_id; Type: INDEX; Schema: public; Owner: postgres
--

CREATE INDEX idx_user_stories_sprint_id ON public.pms_user_stories USING btree (sprint_id);


--
-- Name: pms_audit_logs_reference_idx; Type: INDEX; Schema: public; Owner: postgres
--

CREATE INDEX pms_audit_logs_reference_idx ON public.pms_audit_logs USING btree (reference_id);


--
-- Name: pms_audit_logs_table_idx; Type: INDEX; Schema: public; Owner: postgres
--

CREATE INDEX pms_audit_logs_table_idx ON public.pms_audit_logs USING btree (table_name);


--
-- Name: pms_board_columns_board_id; Type: INDEX; Schema: public; Owner: postgres
--

CREATE INDEX pms_board_columns_board_id ON public.pms_board_columns USING btree (board_id);


--
-- Name: pms_boards_project_id; Type: INDEX; Schema: public; Owner: postgres
--

CREATE INDEX pms_boards_project_id ON public.pms_boards USING btree (project_id);


--
-- Name: pms_features_department_id; Type: INDEX; Schema: public; Owner: postgres
--

CREATE INDEX pms_features_department_id ON public.pms_features USING btree (department_id);


--
-- Name: pms_features_project_index; Type: INDEX; Schema: public; Owner: postgres
--

CREATE INDEX pms_features_project_index ON public.pms_features USING btree (project_id);


--
-- Name: pms_features_status; Type: INDEX; Schema: public; Owner: postgres
--

CREATE INDEX pms_features_status ON public.pms_features USING btree (status);


--
-- Name: pms_issue_attachments_issue_id; Type: INDEX; Schema: public; Owner: postgres
--

CREATE INDEX pms_issue_attachments_issue_id ON public.pms_issue_attachments USING btree (issue_id);


--
-- Name: pms_issue_comments_issue_id; Type: INDEX; Schema: public; Owner: postgres
--

CREATE INDEX pms_issue_comments_issue_id ON public.pms_issue_comments USING btree (issue_id);


--
-- Name: pms_issue_histories_action_type; Type: INDEX; Schema: public; Owner: postgres
--

CREATE INDEX pms_issue_histories_action_type ON public.pms_issue_histories USING btree (action_type);


--
-- Name: pms_issue_histories_created_at; Type: INDEX; Schema: public; Owner: postgres
--

CREATE INDEX pms_issue_histories_created_at ON public.pms_issue_histories USING btree (created_at);


--
-- Name: pms_issue_histories_issue_id; Type: INDEX; Schema: public; Owner: postgres
--

CREATE INDEX pms_issue_histories_issue_id ON public.pms_issue_histories USING btree (issue_id);


--
-- Name: pms_issue_histories_user_id; Type: INDEX; Schema: public; Owner: postgres
--

CREATE INDEX pms_issue_histories_user_id ON public.pms_issue_histories USING btree (user_id);


--
-- Name: pms_issue_stats_count; Type: INDEX; Schema: public; Owner: postgres
--

CREATE INDEX pms_issue_stats_count ON public.pms_issue_stats USING btree (count);


--
-- Name: pms_issue_stats_issue_type_id; Type: INDEX; Schema: public; Owner: postgres
--

CREATE INDEX pms_issue_stats_issue_type_id ON public.pms_issue_stats USING btree (issue_type_id);


--
-- Name: pms_issue_stats_user_id; Type: INDEX; Schema: public; Owner: postgres
--

CREATE INDEX pms_issue_stats_user_id ON public.pms_issue_stats USING btree (user_id);


--
-- Name: pms_issue_types_name; Type: INDEX; Schema: public; Owner: postgres
--

CREATE INDEX pms_issue_types_name ON public.pms_issue_types USING btree (name);


--
-- Name: pms_issues_from_department_id; Type: INDEX; Schema: public; Owner: postgres
--

CREATE INDEX pms_issues_from_department_id ON public.pms_issues USING btree (from_department_id);


--
-- Name: pms_issues_issue_type_id; Type: INDEX; Schema: public; Owner: postgres
--

CREATE INDEX pms_issues_issue_type_id ON public.pms_issues USING btree (issue_type_id);


--
-- Name: pms_issues_priority; Type: INDEX; Schema: public; Owner: postgres
--

CREATE INDEX pms_issues_priority ON public.pms_issues USING btree (priority);


--
-- Name: pms_issues_project_id; Type: INDEX; Schema: public; Owner: postgres
--

CREATE INDEX pms_issues_project_id ON public.pms_issues USING btree (project_id);


--
-- Name: pms_issues_sprint_id; Type: INDEX; Schema: public; Owner: postgres
--

CREATE INDEX pms_issues_sprint_id ON public.pms_issues USING btree (sprint_id);


--
-- Name: pms_issues_status; Type: INDEX; Schema: public; Owner: postgres
--

CREATE INDEX pms_issues_status ON public.pms_issues USING btree (status);


--
-- Name: pms_issues_to_department_id; Type: INDEX; Schema: public; Owner: postgres
--

CREATE INDEX pms_issues_to_department_id ON public.pms_issues USING btree (to_department_id);


--
-- Name: pms_issues_user_story_index; Type: INDEX; Schema: public; Owner: postgres
--

CREATE INDEX pms_issues_user_story_index ON public.pms_issues USING btree (user_story_id);


--
-- Name: pms_notification_reads_reads_notification_idx; Type: INDEX; Schema: public; Owner: postgres
--

CREATE INDEX pms_notification_reads_reads_notification_idx ON public.pms_notification_reads USING btree (notification_id);


--
-- Name: pms_notification_reads_reads_user_idx; Type: INDEX; Schema: public; Owner: postgres
--

CREATE INDEX pms_notification_reads_reads_user_idx ON public.pms_notification_reads USING btree (user_id);


--
-- Name: pms_notifications_department_idx; Type: INDEX; Schema: public; Owner: postgres
--

CREATE INDEX pms_notifications_department_idx ON public.pms_notifications USING btree (department_id);


--
-- Name: pms_notifications_project_idx; Type: INDEX; Schema: public; Owner: postgres
--

CREATE INDEX pms_notifications_project_idx ON public.pms_notifications USING btree (project_id);


--
-- Name: pms_notifications_scope_idx; Type: INDEX; Schema: public; Owner: postgres
--

CREATE INDEX pms_notifications_scope_idx ON public.pms_notifications USING btree (scope);


--
-- Name: pms_notifications_user_idx; Type: INDEX; Schema: public; Owner: postgres
--

CREATE INDEX pms_notifications_user_idx ON public.pms_notifications USING btree (user_id);


--
-- Name: pms_project_features_feature_id; Type: INDEX; Schema: public; Owner: postgres
--

CREATE INDEX pms_project_features_feature_id ON public.pms_project_features USING btree (feature_id);


--
-- Name: pms_project_features_project_id; Type: INDEX; Schema: public; Owner: postgres
--

CREATE INDEX pms_project_features_project_id ON public.pms_project_features USING btree (project_id);


--
-- Name: pms_project_members_department_id; Type: INDEX; Schema: public; Owner: postgres
--

CREATE INDEX pms_project_members_department_id ON public.pms_project_members USING btree (department_id);


--
-- Name: pms_project_members_project_id; Type: INDEX; Schema: public; Owner: postgres
--

CREATE INDEX pms_project_members_project_id ON public.pms_project_members USING btree (project_id);


--
-- Name: pms_project_members_user_id; Type: INDEX; Schema: public; Owner: postgres
--

CREATE INDEX pms_project_members_user_id ON public.pms_project_members USING btree (user_id);


--
-- Name: pms_projects_code_unique; Type: INDEX; Schema: public; Owner: postgres
--

CREATE UNIQUE INDEX pms_projects_code_unique ON public.pms_projects USING btree (code);


--
-- Name: pms_projects_org_index; Type: INDEX; Schema: public; Owner: postgres
--

CREATE INDEX pms_projects_org_index ON public.pms_projects USING btree (organization_id);


--
-- Name: pms_sprints_project_id_status; Type: INDEX; Schema: public; Owner: postgres
--

CREATE INDEX pms_sprints_project_id_status ON public.pms_sprints USING btree (project_id, status);


--
-- Name: pms_story_change_requests_story_status_idx; Type: INDEX; Schema: public; Owner: postgres
--

CREATE INDEX pms_story_change_requests_story_status_idx ON public.pms_story_change_requests USING btree (story_id, status);


--
-- Name: pms_user_stories_department_index; Type: INDEX; Schema: public; Owner: postgres
--

CREATE INDEX pms_user_stories_department_index ON public.pms_user_stories USING btree (department_id);


--
-- Name: pms_user_stories_feature_index; Type: INDEX; Schema: public; Owner: postgres
--

CREATE INDEX pms_user_stories_feature_index ON public.pms_user_stories USING btree (feature_id);


--
-- Name: pms_user_stories_org_index; Type: INDEX; Schema: public; Owner: postgres
--

CREATE INDEX pms_user_stories_org_index ON public.pms_user_stories USING btree (organization_id);


--
-- Name: pms_user_stories_parent_index; Type: INDEX; Schema: public; Owner: postgres
--

CREATE INDEX pms_user_stories_parent_index ON public.pms_user_stories USING btree (parent_user_story_id);


--
-- Name: pms_user_stories_project_index; Type: INDEX; Schema: public; Owner: postgres
--

CREATE INDEX pms_user_stories_project_index ON public.pms_user_stories USING btree (project_id);


--
-- Name: pms_user_stories_status_index; Type: INDEX; Schema: public; Owner: postgres
--

CREATE INDEX pms_user_stories_status_index ON public.pms_user_stories USING btree (status);


--
-- Name: pms_work_logs_dept_user_idx; Type: INDEX; Schema: public; Owner: postgres
--

CREATE INDEX pms_work_logs_dept_user_idx ON public.pms_work_logs USING btree (department_id, user_id);


--
-- Name: pms_work_logs_project_user_idx; Type: INDEX; Schema: public; Owner: postgres
--

CREATE INDEX pms_work_logs_project_user_idx ON public.pms_work_logs USING btree (project_id, user_id);


--
-- Name: pms_work_logs_story_idx; Type: INDEX; Schema: public; Owner: postgres
--

CREATE INDEX pms_work_logs_story_idx ON public.pms_work_logs USING btree (user_story_id);


--
-- Name: pms_work_logs_user_date_idx; Type: INDEX; Schema: public; Owner: postgres
--

CREATE INDEX pms_work_logs_user_date_idx ON public.pms_work_logs USING btree (user_id, log_date);


--
-- Name: uq_user_story_dependency_pair; Type: INDEX; Schema: public; Owner: postgres
--

CREATE UNIQUE INDEX uq_user_story_dependency_pair ON public.pms_user_story_dependencies USING btree (parent_story_id, dependency_story_id);


--
-- Name: pms_board_columns pms_board_columns_board_id_fkey; Type: FK CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.pms_board_columns
    ADD CONSTRAINT pms_board_columns_board_id_fkey FOREIGN KEY (board_id) REFERENCES public.pms_boards(id) ON DELETE CASCADE;


--
-- Name: pms_boards pms_boards_project_id_fkey; Type: FK CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.pms_boards
    ADD CONSTRAINT pms_boards_project_id_fkey FOREIGN KEY (project_id) REFERENCES public.pms_projects(id) ON DELETE CASCADE;


--
-- Name: pms_entity_labels pms_entity_labels_label_id_fkey; Type: FK CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.pms_entity_labels
    ADD CONSTRAINT pms_entity_labels_label_id_fkey FOREIGN KEY (label_id) REFERENCES public.pms_issue_labels(id) ON DELETE CASCADE;


--
-- Name: pms_features pms_features_parent_feature_id_fkey; Type: FK CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.pms_features
    ADD CONSTRAINT pms_features_parent_feature_id_fkey FOREIGN KEY (parent_feature_id) REFERENCES public.pms_features(id) ON DELETE CASCADE;


--
-- Name: pms_features pms_features_project_id_fkey; Type: FK CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.pms_features
    ADD CONSTRAINT pms_features_project_id_fkey FOREIGN KEY (project_id) REFERENCES public.pms_projects(id) ON DELETE CASCADE;


--
-- Name: pms_features pms_features_status_id_fkey; Type: FK CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.pms_features
    ADD CONSTRAINT pms_features_status_id_fkey FOREIGN KEY (status_id) REFERENCES public.pms_issue_statuses(id) ON DELETE SET NULL;


--
-- Name: pms_issue_attachments pms_issue_attachments_issue_id_fkey; Type: FK CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.pms_issue_attachments
    ADD CONSTRAINT pms_issue_attachments_issue_id_fkey FOREIGN KEY (issue_id) REFERENCES public.pms_issues(id) ON UPDATE CASCADE ON DELETE CASCADE;


--
-- Name: pms_issue_comments pms_issue_comments_issue_id_fkey; Type: FK CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.pms_issue_comments
    ADD CONSTRAINT pms_issue_comments_issue_id_fkey FOREIGN KEY (issue_id) REFERENCES public.pms_issues(id) ON UPDATE CASCADE ON DELETE CASCADE;


--
-- Name: pms_issue_histories pms_issue_histories_issue_id_fkey; Type: FK CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.pms_issue_histories
    ADD CONSTRAINT pms_issue_histories_issue_id_fkey FOREIGN KEY (issue_id) REFERENCES public.pms_issues(id) ON UPDATE CASCADE ON DELETE CASCADE;


--
-- Name: pms_issue_labels pms_issue_labels_project_id_fkey; Type: FK CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.pms_issue_labels
    ADD CONSTRAINT pms_issue_labels_project_id_fkey FOREIGN KEY (project_id) REFERENCES public.pms_projects(id) ON DELETE CASCADE;


--
-- Name: pms_issue_stats pms_issue_stats_issue_type_id_fkey; Type: FK CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.pms_issue_stats
    ADD CONSTRAINT pms_issue_stats_issue_type_id_fkey FOREIGN KEY (issue_type_id) REFERENCES public.pms_issue_types(id) ON UPDATE CASCADE ON DELETE CASCADE;


--
-- Name: pms_issue_statuses pms_issue_statuses_project_id_fkey; Type: FK CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.pms_issue_statuses
    ADD CONSTRAINT pms_issue_statuses_project_id_fkey FOREIGN KEY (project_id) REFERENCES public.pms_projects(id) ON DELETE CASCADE;


--
-- Name: pms_issue_transitions pms_issue_transitions_from_status_id_fkey; Type: FK CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.pms_issue_transitions
    ADD CONSTRAINT pms_issue_transitions_from_status_id_fkey FOREIGN KEY (from_status_id) REFERENCES public.pms_issue_statuses(id) ON DELETE CASCADE;


--
-- Name: pms_issue_transitions pms_issue_transitions_project_id_fkey; Type: FK CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.pms_issue_transitions
    ADD CONSTRAINT pms_issue_transitions_project_id_fkey FOREIGN KEY (project_id) REFERENCES public.pms_projects(id) ON DELETE CASCADE;


--
-- Name: pms_issue_transitions pms_issue_transitions_to_status_id_fkey; Type: FK CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.pms_issue_transitions
    ADD CONSTRAINT pms_issue_transitions_to_status_id_fkey FOREIGN KEY (to_status_id) REFERENCES public.pms_issue_statuses(id) ON DELETE CASCADE;


--
-- Name: pms_issues pms_issues_assignee_id_fkey; Type: FK CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.pms_issues
    ADD CONSTRAINT pms_issues_assignee_id_fkey FOREIGN KEY (assignee_id) REFERENCES public.pms_project_members(id) ON DELETE SET NULL;


--
-- Name: pms_issues pms_issues_issue_type_id_fkey; Type: FK CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.pms_issues
    ADD CONSTRAINT pms_issues_issue_type_id_fkey FOREIGN KEY (issue_type_id) REFERENCES public.pms_issue_types(id) ON UPDATE CASCADE ON DELETE RESTRICT;


--
-- Name: pms_issues pms_issues_parent_id_fkey; Type: FK CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.pms_issues
    ADD CONSTRAINT pms_issues_parent_id_fkey FOREIGN KEY (parent_id) REFERENCES public.pms_issues(id) ON DELETE SET NULL;


--
-- Name: pms_issues pms_issues_project_id_fkey; Type: FK CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.pms_issues
    ADD CONSTRAINT pms_issues_project_id_fkey FOREIGN KEY (project_id) REFERENCES public.pms_projects(id) ON UPDATE CASCADE ON DELETE CASCADE;


--
-- Name: pms_issues pms_issues_sprint_id_fkey; Type: FK CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.pms_issues
    ADD CONSTRAINT pms_issues_sprint_id_fkey FOREIGN KEY (sprint_id) REFERENCES public.pms_sprints(id) ON UPDATE CASCADE ON DELETE SET NULL;


--
-- Name: pms_issues pms_issues_status_id_fkey; Type: FK CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.pms_issues
    ADD CONSTRAINT pms_issues_status_id_fkey FOREIGN KEY (status_id) REFERENCES public.pms_issue_statuses(id) ON DELETE SET NULL;


--
-- Name: pms_issues pms_issues_user_story_id_fkey; Type: FK CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.pms_issues
    ADD CONSTRAINT pms_issues_user_story_id_fkey FOREIGN KEY (user_story_id) REFERENCES public.pms_user_stories(id) ON DELETE SET NULL;


--
-- Name: pms_notification_reads pms_notification_reads_notification_id_fkey; Type: FK CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.pms_notification_reads
    ADD CONSTRAINT pms_notification_reads_notification_id_fkey FOREIGN KEY (notification_id) REFERENCES public.pms_notifications(id) ON UPDATE CASCADE ON DELETE CASCADE;


--
-- Name: pms_notifications pms_notifications_project_id_fkey; Type: FK CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.pms_notifications
    ADD CONSTRAINT pms_notifications_project_id_fkey FOREIGN KEY (project_id) REFERENCES public.pms_projects(id) ON UPDATE CASCADE ON DELETE CASCADE;


--
-- Name: pms_project_features pms_project_features_feature_id_fkey; Type: FK CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.pms_project_features
    ADD CONSTRAINT pms_project_features_feature_id_fkey FOREIGN KEY (feature_id) REFERENCES public.pms_features(id) ON UPDATE CASCADE ON DELETE CASCADE;


--
-- Name: pms_project_features pms_project_features_project_id_fkey; Type: FK CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.pms_project_features
    ADD CONSTRAINT pms_project_features_project_id_fkey FOREIGN KEY (project_id) REFERENCES public.pms_projects(id) ON UPDATE CASCADE ON DELETE CASCADE;


--
-- Name: pms_project_members pms_project_members_project_id_fkey; Type: FK CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.pms_project_members
    ADD CONSTRAINT pms_project_members_project_id_fkey FOREIGN KEY (project_id) REFERENCES public.pms_projects(id) ON UPDATE CASCADE ON DELETE CASCADE;


--
-- Name: pms_sprints pms_sprints_project_id_fkey; Type: FK CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.pms_sprints
    ADD CONSTRAINT pms_sprints_project_id_fkey FOREIGN KEY (project_id) REFERENCES public.pms_projects(id) ON DELETE CASCADE;


--
-- Name: pms_story_change_requests pms_story_change_requests_story_id_fkey; Type: FK CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.pms_story_change_requests
    ADD CONSTRAINT pms_story_change_requests_story_id_fkey FOREIGN KEY (story_id) REFERENCES public.pms_user_stories(id) ON DELETE CASCADE;


--
-- Name: pms_user_stories pms_user_stories_feature_id_fkey; Type: FK CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.pms_user_stories
    ADD CONSTRAINT pms_user_stories_feature_id_fkey FOREIGN KEY (feature_id) REFERENCES public.pms_features(id) ON DELETE CASCADE;


--
-- Name: pms_user_stories pms_user_stories_helped_for_fkey; Type: FK CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.pms_user_stories
    ADD CONSTRAINT pms_user_stories_helped_for_fkey FOREIGN KEY (helped_for) REFERENCES public.pms_user_stories(id) ON DELETE SET NULL;


--
-- Name: pms_user_stories pms_user_stories_parent_user_story_id_fkey; Type: FK CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.pms_user_stories
    ADD CONSTRAINT pms_user_stories_parent_user_story_id_fkey FOREIGN KEY (parent_user_story_id) REFERENCES public.pms_user_stories(id) ON DELETE CASCADE;


--
-- Name: pms_user_stories pms_user_stories_project_id_fkey; Type: FK CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.pms_user_stories
    ADD CONSTRAINT pms_user_stories_project_id_fkey FOREIGN KEY (project_id) REFERENCES public.pms_projects(id) ON DELETE CASCADE;


--
-- Name: pms_user_stories pms_user_stories_sprint_id_fkey; Type: FK CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.pms_user_stories
    ADD CONSTRAINT pms_user_stories_sprint_id_fkey FOREIGN KEY (sprint_id) REFERENCES public.pms_sprints(id) ON UPDATE CASCADE ON DELETE SET NULL;


--
-- Name: pms_user_stories pms_user_stories_status_id_fkey; Type: FK CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.pms_user_stories
    ADD CONSTRAINT pms_user_stories_status_id_fkey FOREIGN KEY (status_id) REFERENCES public.pms_issue_statuses(id) ON DELETE SET NULL;


--
-- Name: pms_user_story_dependencies pms_user_story_dependencies_dependency_story_id_fkey; Type: FK CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.pms_user_story_dependencies
    ADD CONSTRAINT pms_user_story_dependencies_dependency_story_id_fkey FOREIGN KEY (dependency_story_id) REFERENCES public.pms_user_stories(id) ON UPDATE CASCADE ON DELETE CASCADE;


--
-- Name: pms_user_story_dependencies pms_user_story_dependencies_parent_story_id_fkey; Type: FK CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.pms_user_story_dependencies
    ADD CONSTRAINT pms_user_story_dependencies_parent_story_id_fkey FOREIGN KEY (parent_story_id) REFERENCES public.pms_user_stories(id) ON UPDATE CASCADE ON DELETE CASCADE;


--
-- PostgreSQL database dump complete
--

\unrestrict sBc7dupx92QP9lvhmtOdutnlxjLbHzs713j1ZRp0cT0ml0xT4FvZncLqF59ugkS

--
-- Database "postgres" dump
--

\connect postgres

--
-- PostgreSQL database dump
--

\restrict 045XQJhxKH0N4oiekNskrgq4fsN8KYNncD8mYXcO8BPmT5mWwepTdYDnWchwbMe

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

\unrestrict 045XQJhxKH0N4oiekNskrgq4fsN8KYNncD8mYXcO8BPmT5mWwepTdYDnWchwbMe

--
-- Database "super_administrator" dump
--

--
-- PostgreSQL database dump
--

\restrict fA6oifRIKZSpoqZgyhdQnWnUpe3Uufe9g2swPIENPKGvcSPmCQClC2fMFFwAmoK

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

\unrestrict fA6oifRIKZSpoqZgyhdQnWnUpe3Uufe9g2swPIENPKGvcSPmCQClC2fMFFwAmoK
\connect super_administrator
\restrict fA6oifRIKZSpoqZgyhdQnWnUpe3Uufe9g2swPIENPKGvcSPmCQClC2fMFFwAmoK

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

\unrestrict fA6oifRIKZSpoqZgyhdQnWnUpe3Uufe9g2swPIENPKGvcSPmCQClC2fMFFwAmoK

--
-- PostgreSQL database cluster dump complete
--

