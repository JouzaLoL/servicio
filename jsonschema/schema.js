// The topmost schema object
let API = {};

// Contains type schemas
API.Type = {};

// Contains response schemas
API.Response = {};

// User Schema
API.Type.User = {
    title: 'User schema',
    type: 'object',
    required: ['email', 'password'],
    properties: {
        email: {
            format: "email",
            minLength: 5,
            maxLength: 30
        },
        password: {
            minLength: 5,
            maxLength: 60
        },
        name: {
            type: 'string',
            minLength: 5,
            maxLength: 30
        },
        telephone: {
            type: 'string',
            minLength: 9,
            maxLength: 13
        },
        cars: API.Type.CarArray
    }
};

// Car array schema
API.Type.CarArray = {
    type: 'array',
    uniqueItems: true,
    items: API.Type.Car
};

// Car Schema
API.Type.Car = {
    type: 'object',
    required: ['model', 'year'],
    properties: {
        model: {
            type: 'string',
            minLength: 5,
            maxLength: 30
        },
        year: {
            type: 'string',
            minLength: 4,
            maxLength: 4
        },
        servicebook: {
            type: 'array',
            uniqueItems: true,
            items: API.Type.Service
        }
    }
};

// Service Entry schema
API.Type.Service = {
    type: 'object',
    required: ['date', 'cost', 'description'],
    properties: {
        date: {
            type: 'string',
            format: 'date'
        },
        cost: {
            type: 'string',
            minLength: 5,
            maxLength: 30
        },
        description: {
            type: 'string',
            minLength: 5,
            maxLength: 30
        }
    }
};

API.Response.Basic = {
    type: "object",
    properties: {
        success: {
            type: "boolean"
        },
        message: {
            type: "string"
        },
    },
    required: [
        "success"
    ]
};

API.Response.Authenticate = {
    // TODO: Nest schema from Response.Basic
};

module.exports = API;