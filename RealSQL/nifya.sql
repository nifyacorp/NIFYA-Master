--
-- PostgreSQL database dump
--

-- Dumped from database version 15.12
-- Dumped by pg_dump version 15.12

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
-- Name: public; Type: SCHEMA; Schema: -; Owner: -
--

-- *not* creating schema, since initdb creates it


--
-- Name: SCHEMA public; Type: COMMENT; Schema: -; Owner: -
--

COMMENT ON SCHEMA public IS '';


--
-- Name: uuid-ossp; Type: EXTENSION; Schema: -; Owner: -
--

CREATE EXTENSION IF NOT EXISTS "uuid-ossp" WITH SCHEMA public;


--
-- Name: EXTENSION "uuid-ossp"; Type: COMMENT; Schema: -; Owner: -
--

COMMENT ON EXTENSION "uuid-ossp" IS 'generate universally unique identifiers (UUIDs)';


--
-- Name: check_schema_version(character varying); Type: FUNCTION; Schema: public; Owner: -
--

CREATE FUNCTION public.check_schema_version(required_version character varying) RETURNS boolean
    LANGUAGE plpgsql
    AS $$
BEGIN
  RETURN EXISTS (
    SELECT 1 FROM schema_version 
    WHERE version = required_version
  );
END;
$$;


--
-- Name: register_schema_version(character varying, text); Type: FUNCTION; Schema: public; Owner: -
--

CREATE FUNCTION public.register_schema_version(version_id character varying, version_description text) RETURNS void
    LANGUAGE plpgsql
    AS $$
BEGIN
  INSERT INTO schema_version (version, description)
  VALUES (version_id, version_description)
  ON CONFLICT (version) DO NOTHING;
END;
$$;


--
-- Name: set_app_user(); Type: FUNCTION; Schema: public; Owner: -
--

CREATE FUNCTION public.set_app_user() RETURNS void
    LANGUAGE plpgsql
    AS $$
BEGIN
  -- Try to get the user_id from the app context
  PERFORM set_config('app.current_user_id', current_setting('app.current_user_id', TRUE), TRUE);
EXCEPTION
  WHEN OTHERS THEN
    -- Default to no user if not set
    PERFORM set_config('app.current_user_id', '', TRUE);
END;
$$;


SET default_tablespace = '';

SET default_table_access_method = heap;

--
-- Name: notifications; Type: TABLE; Schema: public; Owner: -
--

CREATE TABLE public.notifications (
    id uuid DEFAULT public.uuid_generate_v4() NOT NULL,
    user_id uuid NOT NULL,
    title character varying(255) NOT NULL,
    content text,
    read boolean DEFAULT false,
    entity_type character varying(255) DEFAULT 'notification:generic'::character varying,
    source character varying(50),
    data jsonb DEFAULT '{}'::jsonb,
    metadata jsonb DEFAULT '{}'::jsonb,
    created_at timestamp with time zone DEFAULT now(),
    updated_at timestamp with time zone DEFAULT now(),
    email_sent boolean DEFAULT false
);


--
-- Name: TABLE notifications; Type: COMMENT; Schema: public; Owner: -
--

COMMENT ON TABLE public.notifications IS 'User notifications';


--
-- Name: COLUMN notifications.user_id; Type: COMMENT; Schema: public; Owner: -
--

COMMENT ON COLUMN public.notifications.user_id IS 'User who should receive this notification';


--
-- Name: COLUMN notifications.title; Type: COMMENT; Schema: public; Owner: -
--

COMMENT ON COLUMN public.notifications.title IS 'Notification title';


--
-- Name: COLUMN notifications.content; Type: COMMENT; Schema: public; Owner: -
--

COMMENT ON COLUMN public.notifications.content IS 'Notification content text';


--
-- Name: COLUMN notifications.read; Type: COMMENT; Schema: public; Owner: -
--

COMMENT ON COLUMN public.notifications.read IS 'Whether the user has read this notification';


--
-- Name: COLUMN notifications.entity_type; Type: COMMENT; Schema: public; Owner: -
--

COMMENT ON COLUMN public.notifications.entity_type IS 'Type of entity this notification refers to (format: domain:type)';


--
-- Name: COLUMN notifications.source; Type: COMMENT; Schema: public; Owner: -
--

COMMENT ON COLUMN public.notifications.source IS 'Source system that generated this notification';


--
-- Name: COLUMN notifications.data; Type: COMMENT; Schema: public; Owner: -
--

COMMENT ON COLUMN public.notifications.data IS 'Structured data related to this notification';


--
-- Name: COLUMN notifications.email_sent; Type: COMMENT; Schema: public; Owner: -
--

COMMENT ON COLUMN public.notifications.email_sent IS 'Whether an email was sent for this notification';


--
-- Name: schema_version; Type: TABLE; Schema: public; Owner: -
--

CREATE TABLE public.schema_version (
    version character varying(255) NOT NULL,
    applied_at timestamp with time zone DEFAULT now(),
    description text
);


--
-- Name: subscription_processing; Type: TABLE; Schema: public; Owner: -
--

CREATE TABLE public.subscription_processing (
    id uuid DEFAULT public.uuid_generate_v4() NOT NULL,
    subscription_id uuid NOT NULL,
    status character varying(50) DEFAULT 'pending'::character varying NOT NULL,
    started_at timestamp with time zone,
    completed_at timestamp with time zone,
    result jsonb DEFAULT '{}'::jsonb,
    error_message text,
    created_at timestamp with time zone DEFAULT now(),
    updated_at timestamp with time zone DEFAULT now()
);


--
-- Name: TABLE subscription_processing; Type: COMMENT; Schema: public; Owner: -
--

COMMENT ON TABLE public.subscription_processing IS 'Tracks processing status for subscriptions';


--
-- Name: COLUMN subscription_processing.subscription_id; Type: COMMENT; Schema: public; Owner: -
--

COMMENT ON COLUMN public.subscription_processing.subscription_id IS 'The subscription being processed';


--
-- Name: COLUMN subscription_processing.status; Type: COMMENT; Schema: public; Owner: -
--

COMMENT ON COLUMN public.subscription_processing.status IS 'Current processing status (pending, processing, completed, failed)';


--
-- Name: COLUMN subscription_processing.result; Type: COMMENT; Schema: public; Owner: -
--

COMMENT ON COLUMN public.subscription_processing.result IS 'Results of the processing job';


--
-- Name: subscription_types; Type: TABLE; Schema: public; Owner: -
--

CREATE TABLE public.subscription_types (
    id character varying(255) NOT NULL,
    name character varying(255) NOT NULL,
    display_name character varying(255) NOT NULL,
    icon character varying(50),
    created_at timestamp with time zone DEFAULT now(),
    updated_at timestamp with time zone DEFAULT now(),
    metadata jsonb DEFAULT '{}'::jsonb
);


--
-- Name: TABLE subscription_types; Type: COMMENT; Schema: public; Owner: -
--

COMMENT ON TABLE public.subscription_types IS 'Types of subscriptions available';


--
-- Name: COLUMN subscription_types.id; Type: COMMENT; Schema: public; Owner: -
--

COMMENT ON COLUMN public.subscription_types.id IS 'Unique identifier for the subscription type';


--
-- Name: COLUMN subscription_types.name; Type: COMMENT; Schema: public; Owner: -
--

COMMENT ON COLUMN public.subscription_types.name IS 'System name for the subscription type';


--
-- Name: COLUMN subscription_types.display_name; Type: COMMENT; Schema: public; Owner: -
--

COMMENT ON COLUMN public.subscription_types.display_name IS 'Human-readable name for display';


--
-- Name: COLUMN subscription_types.icon; Type: COMMENT; Schema: public; Owner: -
--

COMMENT ON COLUMN public.subscription_types.icon IS 'Icon name for UI display';


--
-- Name: subscriptions; Type: TABLE; Schema: public; Owner: -
--

CREATE TABLE public.subscriptions (
    id uuid DEFAULT public.uuid_generate_v4() NOT NULL,
    name character varying(255) NOT NULL,
    description text,
    user_id uuid NOT NULL,
    type_id character varying(255) NOT NULL,
    prompts jsonb DEFAULT '[]'::jsonb,
    frequency character varying(50) NOT NULL,
    active boolean DEFAULT true,
    created_at timestamp with time zone DEFAULT now(),
    updated_at timestamp with time zone DEFAULT now(),
    metadata jsonb DEFAULT '{}'::jsonb
);


--
-- Name: TABLE subscriptions; Type: COMMENT; Schema: public; Owner: -
--

COMMENT ON TABLE public.subscriptions IS 'User subscriptions for different data sources';


--
-- Name: COLUMN subscriptions.id; Type: COMMENT; Schema: public; Owner: -
--

COMMENT ON COLUMN public.subscriptions.id IS 'Unique identifier for the subscription';


--
-- Name: COLUMN subscriptions.user_id; Type: COMMENT; Schema: public; Owner: -
--

COMMENT ON COLUMN public.subscriptions.user_id IS 'User who owns this subscription';


--
-- Name: COLUMN subscriptions.type_id; Type: COMMENT; Schema: public; Owner: -
--

COMMENT ON COLUMN public.subscriptions.type_id IS 'Type of subscription (BOE, DOGA, etc)';


--
-- Name: COLUMN subscriptions.prompts; Type: COMMENT; Schema: public; Owner: -
--

COMMENT ON COLUMN public.subscriptions.prompts IS 'Search terms or prompts for this subscription';


--
-- Name: COLUMN subscriptions.frequency; Type: COMMENT; Schema: public; Owner: -
--

COMMENT ON COLUMN public.subscriptions.frequency IS 'How often the subscription should be processed';


--
-- Name: COLUMN subscriptions.active; Type: COMMENT; Schema: public; Owner: -
--

COMMENT ON COLUMN public.subscriptions.active IS 'Whether the subscription is currently active';


--
-- Name: user_email_preferences; Type: TABLE; Schema: public; Owner: -
--

CREATE TABLE public.user_email_preferences (
    id uuid DEFAULT public.uuid_generate_v4() NOT NULL,
    user_id uuid NOT NULL,
    subscription_type character varying(255),
    frequency character varying(50) DEFAULT 'immediate'::character varying,
    enabled boolean DEFAULT true,
    created_at timestamp with time zone DEFAULT now(),
    updated_at timestamp with time zone DEFAULT now()
);


--
-- Name: TABLE user_email_preferences; Type: COMMENT; Schema: public; Owner: -
--

COMMENT ON TABLE public.user_email_preferences IS 'User preferences for email notifications';


--
-- Name: COLUMN user_email_preferences.user_id; Type: COMMENT; Schema: public; Owner: -
--

COMMENT ON COLUMN public.user_email_preferences.user_id IS 'User these preferences belong to';


--
-- Name: COLUMN user_email_preferences.subscription_type; Type: COMMENT; Schema: public; Owner: -
--

COMMENT ON COLUMN public.user_email_preferences.subscription_type IS 'Type of subscription these preferences apply to';


--
-- Name: COLUMN user_email_preferences.frequency; Type: COMMENT; Schema: public; Owner: -
--

COMMENT ON COLUMN public.user_email_preferences.frequency IS 'How often to send email notifications (immediate, daily, etc)';


--
-- Name: COLUMN user_email_preferences.enabled; Type: COMMENT; Schema: public; Owner: -
--

COMMENT ON COLUMN public.user_email_preferences.enabled IS 'Whether email notifications are enabled for this type';


--
-- Name: users; Type: TABLE; Schema: public; Owner: -
--

CREATE TABLE public.users (
    id uuid DEFAULT public.uuid_generate_v4() NOT NULL,
    email character varying(255) NOT NULL,
    display_name character varying(255),
    first_name character varying(255),
    last_name character varying(255),
    avatar_url text,
    role character varying(50) DEFAULT 'user'::character varying,
    created_at timestamp with time zone DEFAULT now(),
    updated_at timestamp with time zone DEFAULT now(),
    metadata jsonb DEFAULT '{}'::jsonb
);


--
-- Name: TABLE users; Type: COMMENT; Schema: public; Owner: -
--

COMMENT ON TABLE public.users IS 'User accounts for the application';


--
-- Name: COLUMN users.id; Type: COMMENT; Schema: public; Owner: -
--

COMMENT ON COLUMN public.users.id IS 'Unique identifier for the user';


--
-- Name: COLUMN users.email; Type: COMMENT; Schema: public; Owner: -
--

COMMENT ON COLUMN public.users.email IS 'User email address, used for login';


--
-- Name: COLUMN users.metadata; Type: COMMENT; Schema: public; Owner: -
--

COMMENT ON COLUMN public.users.metadata IS 'Additional user metadata in JSON format';


--
-- Data for Name: notifications; Type: TABLE DATA; Schema: public; Owner: -
--

COPY public.notifications (id, user_id, title, content, read, entity_type, source, data, metadata, created_at, updated_at, email_sent) FROM stdin;
\.


--
-- Data for Name: schema_version; Type: TABLE DATA; Schema: public; Owner: -
--

COPY public.schema_version (version, applied_at, description) FROM stdin;
20250402000000	2025-04-01 09:33:13.454482+00	Consolidated schema reset
20250401500000	2025-04-01 09:33:14.212403+00	Create schema_version table
\.


--
-- Data for Name: subscription_processing; Type: TABLE DATA; Schema: public; Owner: -
--

COPY public.subscription_processing (id, subscription_id, status, started_at, completed_at, result, error_message, created_at, updated_at) FROM stdin;
\.


--
-- Data for Name: subscription_types; Type: TABLE DATA; Schema: public; Owner: -
--

COPY public.subscription_types (id, name, display_name, icon, created_at, updated_at, metadata) FROM stdin;
boe	boe	BOE	FileText	2025-04-01 09:33:13.454482+00	2025-04-01 09:33:13.454482+00	{}
doga	doga	DOGA	FileText	2025-04-01 09:33:13.454482+00	2025-04-01 09:33:13.454482+00	{}
real-estate	real-estate	Real Estate	Home	2025-04-01 09:33:13.454482+00	2025-04-01 09:33:13.454482+00	{}
\.


--
-- Data for Name: subscriptions; Type: TABLE DATA; Schema: public; Owner: -
--

COPY public.subscriptions (id, name, description, user_id, type_id, prompts, frequency, active, created_at, updated_at, metadata) FROM stdin;
\.


--
-- Data for Name: user_email_preferences; Type: TABLE DATA; Schema: public; Owner: -
--

COPY public.user_email_preferences (id, user_id, subscription_type, frequency, enabled, created_at, updated_at) FROM stdin;
\.


--
-- Data for Name: users; Type: TABLE DATA; Schema: public; Owner: -
--

COPY public.users (id, email, display_name, first_name, last_name, avatar_url, role, created_at, updated_at, metadata) FROM stdin;
\.


--
-- Name: notifications notifications_pkey; Type: CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.notifications
    ADD CONSTRAINT notifications_pkey PRIMARY KEY (id);


--
-- Name: schema_version schema_version_pkey; Type: CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.schema_version
    ADD CONSTRAINT schema_version_pkey PRIMARY KEY (version);


--
-- Name: subscription_processing subscription_processing_pkey; Type: CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.subscription_processing
    ADD CONSTRAINT subscription_processing_pkey PRIMARY KEY (id);


--
-- Name: subscription_types subscription_types_pkey; Type: CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.subscription_types
    ADD CONSTRAINT subscription_types_pkey PRIMARY KEY (id);


--
-- Name: subscriptions subscriptions_pkey; Type: CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.subscriptions
    ADD CONSTRAINT subscriptions_pkey PRIMARY KEY (id);


--
-- Name: user_email_preferences user_email_preferences_pkey; Type: CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.user_email_preferences
    ADD CONSTRAINT user_email_preferences_pkey PRIMARY KEY (id);


--
-- Name: user_email_preferences user_email_preferences_user_id_subscription_type_key; Type: CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.user_email_preferences
    ADD CONSTRAINT user_email_preferences_user_id_subscription_type_key UNIQUE (user_id, subscription_type);


--
-- Name: users users_email_key; Type: CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.users
    ADD CONSTRAINT users_email_key UNIQUE (email);


--
-- Name: users users_pkey; Type: CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.users
    ADD CONSTRAINT users_pkey PRIMARY KEY (id);


--
-- Name: idx_notifications_created_at; Type: INDEX; Schema: public; Owner: -
--

CREATE INDEX idx_notifications_created_at ON public.notifications USING btree (created_at);


--
-- Name: idx_notifications_entity_type; Type: INDEX; Schema: public; Owner: -
--

CREATE INDEX idx_notifications_entity_type ON public.notifications USING btree (entity_type);


--
-- Name: idx_notifications_read; Type: INDEX; Schema: public; Owner: -
--

CREATE INDEX idx_notifications_read ON public.notifications USING btree (read);


--
-- Name: idx_notifications_user_id; Type: INDEX; Schema: public; Owner: -
--

CREATE INDEX idx_notifications_user_id ON public.notifications USING btree (user_id);


--
-- Name: idx_subscription_processing_status; Type: INDEX; Schema: public; Owner: -
--

CREATE INDEX idx_subscription_processing_status ON public.subscription_processing USING btree (status);


--
-- Name: idx_subscription_processing_subscription_id; Type: INDEX; Schema: public; Owner: -
--

CREATE INDEX idx_subscription_processing_subscription_id ON public.subscription_processing USING btree (subscription_id);


--
-- Name: idx_subscriptions_active; Type: INDEX; Schema: public; Owner: -
--

CREATE INDEX idx_subscriptions_active ON public.subscriptions USING btree (active);


--
-- Name: idx_subscriptions_type_id; Type: INDEX; Schema: public; Owner: -
--

CREATE INDEX idx_subscriptions_type_id ON public.subscriptions USING btree (type_id);


--
-- Name: idx_subscriptions_user_id; Type: INDEX; Schema: public; Owner: -
--

CREATE INDEX idx_subscriptions_user_id ON public.subscriptions USING btree (user_id);


--
-- Name: idx_user_email_preferences_user_id; Type: INDEX; Schema: public; Owner: -
--

CREATE INDEX idx_user_email_preferences_user_id ON public.user_email_preferences USING btree (user_id);


--
-- Name: notifications notifications_user_id_fkey; Type: FK CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.notifications
    ADD CONSTRAINT notifications_user_id_fkey FOREIGN KEY (user_id) REFERENCES public.users(id) ON DELETE CASCADE;


--
-- Name: subscription_processing subscription_processing_subscription_id_fkey; Type: FK CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.subscription_processing
    ADD CONSTRAINT subscription_processing_subscription_id_fkey FOREIGN KEY (subscription_id) REFERENCES public.subscriptions(id) ON DELETE CASCADE;


--
-- Name: subscriptions subscriptions_type_id_fkey; Type: FK CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.subscriptions
    ADD CONSTRAINT subscriptions_type_id_fkey FOREIGN KEY (type_id) REFERENCES public.subscription_types(id);


--
-- Name: subscriptions subscriptions_user_id_fkey; Type: FK CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.subscriptions
    ADD CONSTRAINT subscriptions_user_id_fkey FOREIGN KEY (user_id) REFERENCES public.users(id) ON DELETE CASCADE;


--
-- Name: user_email_preferences user_email_preferences_subscription_type_fkey; Type: FK CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.user_email_preferences
    ADD CONSTRAINT user_email_preferences_subscription_type_fkey FOREIGN KEY (subscription_type) REFERENCES public.subscription_types(id);


--
-- Name: user_email_preferences user_email_preferences_user_id_fkey; Type: FK CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.user_email_preferences
    ADD CONSTRAINT user_email_preferences_user_id_fkey FOREIGN KEY (user_id) REFERENCES public.users(id) ON DELETE CASCADE;


--
-- Name: notifications admin_all_access; Type: POLICY; Schema: public; Owner: -
--

CREATE POLICY admin_all_access ON public.notifications USING ((current_setting('app.current_user_id'::text, true) IN ( SELECT (users.id)::text AS id
   FROM public.users
  WHERE ((users.role)::text = 'admin'::text))));


--
-- Name: subscription_processing admin_all_access; Type: POLICY; Schema: public; Owner: -
--

CREATE POLICY admin_all_access ON public.subscription_processing USING ((current_setting('app.current_user_id'::text, true) IN ( SELECT (users.id)::text AS id
   FROM public.users
  WHERE ((users.role)::text = 'admin'::text))));


--
-- Name: subscriptions admin_all_access; Type: POLICY; Schema: public; Owner: -
--

CREATE POLICY admin_all_access ON public.subscriptions USING ((current_setting('app.current_user_id'::text, true) IN ( SELECT (users.id)::text AS id
   FROM public.users
  WHERE ((users.role)::text = 'admin'::text))));


--
-- Name: user_email_preferences admin_all_access; Type: POLICY; Schema: public; Owner: -
--

CREATE POLICY admin_all_access ON public.user_email_preferences USING ((current_setting('app.current_user_id'::text, true) IN ( SELECT (users.id)::text AS id
   FROM public.users
  WHERE ((users.role)::text = 'admin'::text))));


--
-- Name: users admin_all_access; Type: POLICY; Schema: public; Owner: -
--

CREATE POLICY admin_all_access ON public.users USING ((current_setting('app.current_user_id'::text, true) IN ( SELECT (users_1.id)::text AS id
   FROM public.users users_1
  WHERE ((users_1.role)::text = 'admin'::text))));


--
-- Name: notifications; Type: ROW SECURITY; Schema: public; Owner: -
--

ALTER TABLE public.notifications ENABLE ROW LEVEL SECURITY;

--
-- Name: notifications notifications_user_access; Type: POLICY; Schema: public; Owner: -
--

CREATE POLICY notifications_user_access ON public.notifications USING (((user_id)::text = current_setting('app.current_user_id'::text, true)));


--
-- Name: subscription_processing; Type: ROW SECURITY; Schema: public; Owner: -
--

ALTER TABLE public.subscription_processing ENABLE ROW LEVEL SECURITY;

--
-- Name: subscription_processing subscription_processing_user_access; Type: POLICY; Schema: public; Owner: -
--

CREATE POLICY subscription_processing_user_access ON public.subscription_processing USING ((subscription_id IN ( SELECT subscriptions.id
   FROM public.subscriptions
  WHERE ((subscriptions.user_id)::text = current_setting('app.current_user_id'::text, true)))));


--
-- Name: subscriptions; Type: ROW SECURITY; Schema: public; Owner: -
--

ALTER TABLE public.subscriptions ENABLE ROW LEVEL SECURITY;

--
-- Name: subscriptions subscriptions_user_access; Type: POLICY; Schema: public; Owner: -
--

CREATE POLICY subscriptions_user_access ON public.subscriptions USING (((user_id)::text = current_setting('app.current_user_id'::text, true)));


--
-- Name: user_email_preferences; Type: ROW SECURITY; Schema: public; Owner: -
--

ALTER TABLE public.user_email_preferences ENABLE ROW LEVEL SECURITY;

--
-- Name: user_email_preferences user_email_preferences_user_access; Type: POLICY; Schema: public; Owner: -
--

CREATE POLICY user_email_preferences_user_access ON public.user_email_preferences USING (((user_id)::text = current_setting('app.current_user_id'::text, true)));


--
-- Name: users; Type: ROW SECURITY; Schema: public; Owner: -
--

ALTER TABLE public.users ENABLE ROW LEVEL SECURITY;

--
-- Name: users users_self_access; Type: POLICY; Schema: public; Owner: -
--

CREATE POLICY users_self_access ON public.users USING (((id)::text = current_setting('app.current_user_id'::text, true)));


--
-- Name: SCHEMA public; Type: ACL; Schema: -; Owner: -
--

REVOKE USAGE ON SCHEMA public FROM PUBLIC;
GRANT ALL ON SCHEMA public TO PUBLIC;


--
-- Name: FUNCTION pg_replication_origin_advance(text, pg_lsn); Type: ACL; Schema: pg_catalog; Owner: -
--

GRANT ALL ON FUNCTION pg_catalog.pg_replication_origin_advance(text, pg_lsn) TO cloudsqlsuperuser;


--
-- Name: FUNCTION pg_replication_origin_create(text); Type: ACL; Schema: pg_catalog; Owner: -
--

GRANT ALL ON FUNCTION pg_catalog.pg_replication_origin_create(text) TO cloudsqlsuperuser;


--
-- Name: FUNCTION pg_replication_origin_drop(text); Type: ACL; Schema: pg_catalog; Owner: -
--

GRANT ALL ON FUNCTION pg_catalog.pg_replication_origin_drop(text) TO cloudsqlsuperuser;


--
-- Name: FUNCTION pg_replication_origin_oid(text); Type: ACL; Schema: pg_catalog; Owner: -
--

GRANT ALL ON FUNCTION pg_catalog.pg_replication_origin_oid(text) TO cloudsqlsuperuser;


--
-- Name: FUNCTION pg_replication_origin_progress(text, boolean); Type: ACL; Schema: pg_catalog; Owner: -
--

GRANT ALL ON FUNCTION pg_catalog.pg_replication_origin_progress(text, boolean) TO cloudsqlsuperuser;


--
-- Name: FUNCTION pg_replication_origin_session_is_setup(); Type: ACL; Schema: pg_catalog; Owner: -
--

GRANT ALL ON FUNCTION pg_catalog.pg_replication_origin_session_is_setup() TO cloudsqlsuperuser;


--
-- Name: FUNCTION pg_replication_origin_session_progress(boolean); Type: ACL; Schema: pg_catalog; Owner: -
--

GRANT ALL ON FUNCTION pg_catalog.pg_replication_origin_session_progress(boolean) TO cloudsqlsuperuser;


--
-- Name: FUNCTION pg_replication_origin_session_reset(); Type: ACL; Schema: pg_catalog; Owner: -
--

GRANT ALL ON FUNCTION pg_catalog.pg_replication_origin_session_reset() TO cloudsqlsuperuser;


--
-- Name: FUNCTION pg_replication_origin_session_setup(text); Type: ACL; Schema: pg_catalog; Owner: -
--

GRANT ALL ON FUNCTION pg_catalog.pg_replication_origin_session_setup(text) TO cloudsqlsuperuser;


--
-- Name: FUNCTION pg_replication_origin_xact_reset(); Type: ACL; Schema: pg_catalog; Owner: -
--

GRANT ALL ON FUNCTION pg_catalog.pg_replication_origin_xact_reset() TO cloudsqlsuperuser;


--
-- Name: FUNCTION pg_replication_origin_xact_setup(pg_lsn, timestamp with time zone); Type: ACL; Schema: pg_catalog; Owner: -
--

GRANT ALL ON FUNCTION pg_catalog.pg_replication_origin_xact_setup(pg_lsn, timestamp with time zone) TO cloudsqlsuperuser;


--
-- Name: FUNCTION pg_show_replication_origin_status(OUT local_id oid, OUT external_id text, OUT remote_lsn pg_lsn, OUT local_lsn pg_lsn); Type: ACL; Schema: pg_catalog; Owner: -
--

GRANT ALL ON FUNCTION pg_catalog.pg_show_replication_origin_status(OUT local_id oid, OUT external_id text, OUT remote_lsn pg_lsn, OUT local_lsn pg_lsn) TO cloudsqlsuperuser;


--
-- PostgreSQL database dump complete
--

