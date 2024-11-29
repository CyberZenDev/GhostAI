
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

CREATE EXTENSION IF NOT EXISTS "pgsodium" WITH SCHEMA "pgsodium";

COMMENT ON SCHEMA "public" IS 'standard public schema';

CREATE EXTENSION IF NOT EXISTS "pg_graphql" WITH SCHEMA "graphql";

CREATE EXTENSION IF NOT EXISTS "pg_stat_statements" WITH SCHEMA "extensions";

CREATE EXTENSION IF NOT EXISTS "pgcrypto" WITH SCHEMA "extensions";

CREATE EXTENSION IF NOT EXISTS "pgjwt" WITH SCHEMA "extensions";

CREATE EXTENSION IF NOT EXISTS "supabase_vault" WITH SCHEMA "vault";

CREATE EXTENSION IF NOT EXISTS "uuid-ossp" WITH SCHEMA "extensions";

CREATE OR REPLACE FUNCTION "public"."trigger_set_timestamp"() RETURNS "trigger"
    LANGUAGE "plpgsql"
    AS $$
BEGIN
  NEW.updated_at = NOW();
  RETURN NEW;
END;
$$;

ALTER FUNCTION "public"."trigger_set_timestamp"() OWNER TO "postgres";

CREATE OR REPLACE FUNCTION "public"."update_updated_at_column"() RETURNS "trigger"
    LANGUAGE "plpgsql"
    AS $$
begin
    new.updated_at = now();
    return new;
end;
$$;

ALTER FUNCTION "public"."update_updated_at_column"() OWNER TO "postgres";

SET default_tablespace = '';

SET default_table_access_method = "heap";

CREATE TABLE IF NOT EXISTS "public"."chat_histories" (
    "id" "uuid" DEFAULT "gen_random_uuid"() NOT NULL,
    "title" "text" NOT NULL,
    "messages" "jsonb" NOT NULL,
    "mode" "text" NOT NULL,
    "created_at" timestamp with time zone DEFAULT "timezone"('utc'::"text", "now"()) NOT NULL,
    "updated_at" timestamp with time zone DEFAULT "timezone"('utc'::"text", "now"()) NOT NULL,
    "collection_id" "uuid",
    "user" "uuid"
);

ALTER TABLE "public"."chat_histories" OWNER TO "postgres";

CREATE TABLE IF NOT EXISTS "public"."collections" (
    "id" "uuid" DEFAULT "extensions"."uuid_generate_v4"() NOT NULL,
    "name" "text" NOT NULL,
    "created_at" timestamp with time zone DEFAULT "timezone"('utc'::"text", "now"()) NOT NULL,
    "updated_at" timestamp with time zone DEFAULT "timezone"('utc'::"text", "now"()) NOT NULL,
    "user" "uuid"
);

ALTER TABLE "public"."collections" OWNER TO "postgres";

ALTER TABLE ONLY "public"."chat_histories"
    ADD CONSTRAINT "chat_histories_pkey" PRIMARY KEY ("id");

ALTER TABLE ONLY "public"."collections"
    ADD CONSTRAINT "collections_pkey" PRIMARY KEY ("id");

CREATE INDEX "chat_histories_created_at_idx" ON "public"."chat_histories" USING "btree" ("created_at" DESC);

CREATE INDEX "idx_chat_histories_collection_id" ON "public"."chat_histories" USING "btree" ("collection_id");

CREATE OR REPLACE TRIGGER "set_timestamp" BEFORE UPDATE ON "public"."collections" FOR EACH ROW EXECUTE FUNCTION "public"."trigger_set_timestamp"();

CREATE OR REPLACE TRIGGER "update_chat_histories_updated_at" BEFORE UPDATE ON "public"."chat_histories" FOR EACH ROW EXECUTE FUNCTION "public"."update_updated_at_column"();

ALTER TABLE ONLY "public"."chat_histories"
    ADD CONSTRAINT "chat_histories_collection_id_fkey" FOREIGN KEY ("collection_id") REFERENCES "public"."collections"("id");

ALTER TABLE ONLY "public"."chat_histories"
    ADD CONSTRAINT "chat_histories_user_fkey" FOREIGN KEY ("user") REFERENCES "auth"."users"("id");

ALTER TABLE ONLY "public"."collections"
    ADD CONSTRAINT "collections_user_fkey" FOREIGN KEY ("user") REFERENCES "auth"."users"("id");

CREATE POLICY "Allow delete for all users" ON "public"."chat_histories" FOR DELETE USING (true);

CREATE POLICY "Allow insert for all users" ON "public"."chat_histories" FOR INSERT WITH CHECK (true);

CREATE POLICY "Allow select for all users" ON "public"."chat_histories" FOR SELECT USING (true);

CREATE POLICY "Allow update for all users" ON "public"."chat_histories" FOR UPDATE USING (true);

CREATE POLICY "Enable all operations for all users" ON "public"."chat_histories" USING (true) WITH CHECK (true);

CREATE POLICY "Users can create their own chat histories" ON "public"."chat_histories" FOR INSERT WITH CHECK ((("auth"."uid"())::"text" = USER));

CREATE POLICY "Users can create their own collections" ON "public"."collections" FOR INSERT WITH CHECK (("auth"."uid"() = (USER)::"uuid"));

CREATE POLICY "Users can delete their own chat histories" ON "public"."chat_histories" FOR DELETE USING ((("auth"."uid"())::"text" = USER));

CREATE POLICY "Users can delete their own collections" ON "public"."collections" FOR DELETE USING (("auth"."uid"() = (USER)::"uuid"));

CREATE POLICY "Users can update their own chat histories" ON "public"."chat_histories" FOR UPDATE USING ((("auth"."uid"())::"text" = USER));

CREATE POLICY "Users can update their own collections" ON "public"."collections" FOR UPDATE USING (("auth"."uid"() = (USER)::"uuid"));

CREATE POLICY "Users can view their own chat histories" ON "public"."chat_histories" FOR SELECT USING ((("auth"."uid"())::"text" = USER));

CREATE POLICY "Users can view their own collections" ON "public"."collections" FOR SELECT USING (("auth"."uid"() = (USER)::"uuid"));

ALTER TABLE "public"."chat_histories" ENABLE ROW LEVEL SECURITY;

ALTER TABLE "public"."collections" ENABLE ROW LEVEL SECURITY;

ALTER PUBLICATION "supabase_realtime" OWNER TO "postgres";

GRANT USAGE ON SCHEMA "public" TO "postgres";
GRANT USAGE ON SCHEMA "public" TO "anon";
GRANT USAGE ON SCHEMA "public" TO "authenticated";
GRANT USAGE ON SCHEMA "public" TO "service_role";

GRANT ALL ON FUNCTION "public"."trigger_set_timestamp"() TO "anon";
GRANT ALL ON FUNCTION "public"."trigger_set_timestamp"() TO "authenticated";
GRANT ALL ON FUNCTION "public"."trigger_set_timestamp"() TO "service_role";

GRANT ALL ON FUNCTION "public"."update_updated_at_column"() TO "anon";
GRANT ALL ON FUNCTION "public"."update_updated_at_column"() TO "authenticated";
GRANT ALL ON FUNCTION "public"."update_updated_at_column"() TO "service_role";

GRANT ALL ON TABLE "public"."chat_histories" TO "anon";
GRANT ALL ON TABLE "public"."chat_histories" TO "authenticated";
GRANT ALL ON TABLE "public"."chat_histories" TO "service_role";

GRANT ALL ON TABLE "public"."collections" TO "anon";
GRANT ALL ON TABLE "public"."collections" TO "authenticated";
GRANT ALL ON TABLE "public"."collections" TO "service_role";

ALTER DEFAULT PRIVILEGES FOR ROLE "postgres" IN SCHEMA "public" GRANT ALL ON SEQUENCES  TO "postgres";
ALTER DEFAULT PRIVILEGES FOR ROLE "postgres" IN SCHEMA "public" GRANT ALL ON SEQUENCES  TO "anon";
ALTER DEFAULT PRIVILEGES FOR ROLE "postgres" IN SCHEMA "public" GRANT ALL ON SEQUENCES  TO "authenticated";
ALTER DEFAULT PRIVILEGES FOR ROLE "postgres" IN SCHEMA "public" GRANT ALL ON SEQUENCES  TO "service_role";

ALTER DEFAULT PRIVILEGES FOR ROLE "postgres" IN SCHEMA "public" GRANT ALL ON FUNCTIONS  TO "postgres";
ALTER DEFAULT PRIVILEGES FOR ROLE "postgres" IN SCHEMA "public" GRANT ALL ON FUNCTIONS  TO "anon";
ALTER DEFAULT PRIVILEGES FOR ROLE "postgres" IN SCHEMA "public" GRANT ALL ON FUNCTIONS  TO "authenticated";
ALTER DEFAULT PRIVILEGES FOR ROLE "postgres" IN SCHEMA "public" GRANT ALL ON FUNCTIONS  TO "service_role";

ALTER DEFAULT PRIVILEGES FOR ROLE "postgres" IN SCHEMA "public" GRANT ALL ON TABLES  TO "postgres";
ALTER DEFAULT PRIVILEGES FOR ROLE "postgres" IN SCHEMA "public" GRANT ALL ON TABLES  TO "anon";
ALTER DEFAULT PRIVILEGES FOR ROLE "postgres" IN SCHEMA "public" GRANT ALL ON TABLES  TO "authenticated";
ALTER DEFAULT PRIVILEGES FOR ROLE "postgres" IN SCHEMA "public" GRANT ALL ON TABLES  TO "service_role";

RESET ALL;
