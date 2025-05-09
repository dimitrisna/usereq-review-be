module.exports = {
    USER_ROLES: ['Admin', 'TeamLead', 'User'],
    PROJECT_REQUIREMENT_RATING: ['1', '2', '3', '4', '5'],
    PROJECT_REQUIREMENT_TYPE: ['Functional', 'Non-Functional', 'Business', 'User', 'System'],
    PROJECT_REQUIREMENT_PRIORITY: ['Critical', 'High', 'Medium', 'Low'],
    PROJECT_STORY_RATING: ['1', '2', '3', '4', '5'],
    PROJECT_INTEGRATIONS: ['GitHub', 'JIRA', 'Trello'],
    EMAIL_CHARACTERS: { regex: /^\w+([\.-]?\w+)*@\w+([\.-]?\w+)*(\.\w{2,3})+$/ },
    USERNAME_CHARACTERS: { min: 3, max: 15, regex: /^[A-Za-z._0123456789]+$/ },
    PASSWORD_CHARACTERS: { min: 6 },
    FULLNAME_CHARACTERS: {
        min: 5,
        max: 50,
        regex: /^[A-Za-zΑ-Ωα-ωΆάΈέΉήΊίϊΐΌόΎύΏώ ]+$/,
    }
};