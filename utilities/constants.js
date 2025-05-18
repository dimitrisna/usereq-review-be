module.exports = {
	USER_ROLES: ['Admin', 'User', 'TeamLead', 'Researcher'],
	EMAIL_CHARACTERS: { regex: /^\w+([\.-]?\w+)*@\w+([\.-]?\w+)*(\.\w{2,3})+$/ },
	USERNAME_CHARACTERS: { min: 3, max: 15, regex: /^[A-Za-z._0123456789]+$/ },
	PASSWORD_CHARACTERS: { min: 6 },
	FULLNAME_CHARACTERS: {
		min: 5,
		max: 50,
		regex: /^[A-Za-zΑ-Ωα-ωΆάΈέΉήΊίϊΐΌόΎύΏώ ]+$/,
	},
	PROJECT_REQUIREMENT_RATING: ['Correct', 'MinorFlaw', 'MajorFlaw'],
	PROJECT_REQUIREMENT_TYPE: ['Functional', 'NonFunctional', 'Other'],
	PROJECT_REQUIREMENT_PRIORITY: ['Low', 'Medium', 'High'],
	PROJECT_STORY_RATING: [
		'Correct',
		'Complete',
		'Incomplete',
		'MinorFlaw',
		'MajorFlaw',
	],
	PROJECT_EXPORTABLE_FIELDS: [
		'description',
		'tags',
		'users',
		'requirements',
		'stories',
		'files',
		'swagger',
		'createdAt',
		'updatedAt',
	],
	PROJECT_INTEGRATIONS: ['cyclopt'],
	SYSTEM_USER_ID: "000000000000000000000000"
};
