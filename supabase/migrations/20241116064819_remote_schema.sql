drop policy "Users can create their own collections" on "public"."collections";

drop policy "Users can delete their own collections" on "public"."collections";

drop policy "Users can update their own collections" on "public"."collections";

drop policy "Users can view their own collections" on "public"."collections";

alter table "public"."chat_histories" add column "comments" jsonb;

create policy "Allow authenticated users to create collections"
on "public"."collections"
as permissive
for insert
to authenticated
with check ((auth.uid() IS NOT NULL));


create policy "Allow authenticated users to delete their collections"
on "public"."collections"
as permissive
for delete
to authenticated
using ((auth.uid() = (USER)::uuid));


create policy "Allow authenticated users to update their collections"
on "public"."collections"
as permissive
for update
to authenticated
using ((auth.uid() = (USER)::uuid))
with check ((auth.uid() = (USER)::uuid));


create policy "Allow authenticated users to view their collections"
on "public"."collections"
as permissive
for select
to authenticated
using ((auth.uid() = (USER)::uuid));


create policy "Allow delete for all users"
on "public"."collections"
as permissive
for delete
to public
using (true);


create policy "Allow insert for all users"
on "public"."collections"
as permissive
for insert
to public
with check (true);


create policy "Allow select for all users"
on "public"."collections"
as permissive
for select
to public
using (true);


create policy "Allow update for all users"
on "public"."collections"
as permissive
for update
to public
using (true)
with check (true);


create policy "Users can create their own chat histories"
on "public"."collections"
as permissive
for insert
to public
with check ((auth.uid() = (USER)::uuid));


create policy "Users can delete their own chat histories"
on "public"."collections"
as permissive
for delete
to public
using ((auth.uid() = (USER)::uuid));


create policy "Users can update their own chat histories"
on "public"."collections"
as permissive
for update
to public
using ((auth.uid() = (USER)::uuid))
with check ((auth.uid() = (USER)::uuid));


create policy "Users can view their own chat histories"
on "public"."collections"
as permissive
for select
to public
using ((auth.uid() = (USER)::uuid));



