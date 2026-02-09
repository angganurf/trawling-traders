-- Drop our app's subscriptions table so cedros-pay can create its own.
-- Subscription management is now handled by cedros-pay.
DROP TABLE IF EXISTS subscriptions;
