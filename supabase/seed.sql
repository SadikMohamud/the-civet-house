-- The Civet House seed data

-- Default rule: buy 9, get the 10th free.
insert into public.loyalty_settings (stamps_required, reward_description)
values (9, 'A free coffee on us');

-- Owner bootstrap: create an account in the app once with the owner's email
-- and confirm it, then run the line below in the Supabase SQL editor with the
-- real address. After that, the owner promotes staff from the dashboard.
--
-- update public.profiles set role = 'owner' where email = 'owner@example.com';
