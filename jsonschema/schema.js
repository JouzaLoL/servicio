// The topmost schema object
let API = {};

// Contains type schemas
API.Type = {};

// Contains response schemas
API.Response = {};

// Contains request schemas
API.Request = {};

// Contains Parameters-specific schemas
API.Request.Params = {};

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

// Car array schema
API.Type.CarArray = {
    type: 'array',
    uniqueItems: true,
    items: API.Type.Car
};

// User Schema
API.Type.User = {
    type: 'object',
    required: ['email', 'password'],
    properties: {
        email: {
            type: 'string',
            format: 'email',
            minLength: 5,
            maxLength: 30
        },
        password: {
            type: 'string',
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

API.Request.Authenticate = {
    type: 'object',
    required: ['email', 'password'],
    properties: {
        email: {
            type: 'string',
            format: 'email',
            minLength: 5,
            maxLength: 30
        },
        password: {
            type: 'string',
            minLength: 5,
            maxLength: 60
        }
    }
};

// Inheritance
API.Request.Register = API.Type.User;
API.Request.NewCar = API.Type.Car;
API.Request.NewService = API.Type.Service;

// Query with ID (for example for a Car)
API.Request.Params.ID = {
    type: 'object',
    properties: {
        id: {
            type: 'string',
            pattern: '/[a-zA-Z0-9]/',
            minLength: 24,
            maxLength: 24
        }
    }
};

module.exports = API;