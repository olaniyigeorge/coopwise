

## Backend TODOs
- use Celery for background tasks





### Models
##### User
id, name, email, phone, password_hash, income_range, savings_goal, created_at, updated_at

##### Cooperative
id, name, creator_id, invite_code, target_amount, contribution_frequency, rotation_rule, created_at

##### Membership
id, user_id, cooperative_id, is_admin, joined_at

##### Contributions
 id, user_id, cooperative_id, amount, date, auto_logged, status