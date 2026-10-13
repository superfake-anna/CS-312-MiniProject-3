CREATE TABLE IF NOT EXISTS users (
	user_id VARCHAR(255) PRIMARY KEY,
	password VARCHAR(255) NOT NULL,
	name VARCHAR(255) NOT NULL
);

CREATE TABLE IF NOT EXISTS blogs (
	blog_id SERIAL PRIMARY KEY,
	creator_name VARCHAR(255) NOT NULL,
	creator_user_id VARCHAR(255) REFERENCES users(user_id),
	title VARCHAR(255) NOT NULL,
	body TEXT NOT NULL,
	date_created TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

INSERT INTO users(user_id, password, name)
VALUES
	('clarkkent1978', 'lois', 'Clark'),
	('peterb', 'mj', 'Peter'),
	('brucewayne', 'batman', 'Bruce');

INSERT INTO blogs (creator_name, creator_user_id, title, body, date_created)
VALUES
	('Clark', 'clarkkent1978', 'Kent Farm',
	'I will be sharing all the animals I have on my farm.',
	CURRENT_TIMESTAMP - interval '3 days'),
	('Peter', 'peterb', 'Spiderman needs a Break too',
	'Spiderman cannot always be there to save everyone and here is why.',
	CURRENT_TIMESTAMP - interval '3 days'),
	('Bruce', 'brucewayne', 'Update',
	'I will be donated money to a new charity.',
	CURRENT_TIMESTAMP - interval '2 days'),
	('Clark', 'clarkkent1978', 'Daily Planet',
	'What is working at the daily planet really like?',
	CURRENT_TIMESTAMP - interval '2 days'),
	('Peter', 'peterb', 'Spiderman is trying his best',
	'Spiderman is swamped with a lot of different things right now and here is how I know.',
	CURRENT_TIMESTAMP - interval '1 day');