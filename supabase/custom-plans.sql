-- Subscriptions are bespoke per client — there are no tiers. `plan` is the
-- name of that client's arrangement and `plan_includes` is what it covers.
alter table public.profiles add column if not exists plan_includes text;

update public.profiles set plan = 'Custom', plan_includes = 'Basic maintenance + website hosting'
  where email = 'info@smooveskinstudio.com';
update public.profiles set plan = 'Custom', plan_includes = 'Website hosting'
  where email = 'tyoung@younglifemanagement.com';
update public.profiles set plan = 'Custom', plan_includes = 'Website maintenance + hosting'
  where email = 'aojldf@gmail.com';
update public.profiles set plan = 'Custom', plan_includes = 'Website maintenance + hosting'
  where email = 'brandonanthonymarsh876@gmail.com';
update public.profiles set plan = 'Custom',
  plan_includes = 'Hosting for the Mamma Mia site, basic maintenance to websites & app, technical support for other custom solutions developed'
  where email = 'shoprocketboyzllc@gmail.com';
