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
    required: ['date', 'cost', 'description', 'receipt', 'vendorID'],
    properties: {
        date: {
            type: 'string',
            format: 'date-time'
        },
        cost: {
            type: 'string',
            minLength: 1,
            maxLength: 30
        },
        description: {
            type: 'string',
            maxLength: 300
        },
        vendorID: {
            type: 'string'
        },
        receipt: {
            type: 'object',
            required: ['data', 'contentType'],
            properties: {
                data: {},
                contentType: {
                    type: 'string'
                }
            }
        }
    }
};

API.Type.ServiceArray = {
    type: 'array',
    uniqueItems: true,
    items: API.Type.Service
};

// Car Schema
API.Type.Car = {
    type: 'object',
    required: ['model', 'year', 'SPZ'],
    properties: {
        model: {
            type: 'string',
            minLength: 5,
            maxLength: 30
        },
        SPZ: {
            type: 'string',
            minLength: 7,
            maxLength: 7
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

API.Type.Vendor = {
    type: 'object',
    required: ['email', 'name', 'password'],
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
            maxLength: 50
        },
        telephone: {
            type: 'string',
            minLength: 9,
            maxLength: 13
        },
        address: {
            type: 'string',
            minLength: 9,
            maxLength: 80
        }
    }
};


API.Response.Basic = {
    type: "object",
    required: ['success'],
    properties: {
        success: {
            type: "boolean"
        },
        message: {
            type: "string"
        },
    }
};

API.Response.User = {
    type: 'object',
    required: ['email'],
    properties: {
        email: {
            type: 'string',
            format: 'email',
            minLength: 5,
            maxLength: 30
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
        }
    }
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
API.Request.NewCar = API.Type.Car;
API.Request.PatchCar = {
    type: 'object',
    additionalProperties: false,
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
        SPZ: {
            type: 'string',
            minLength: 7,
            maxLength: 7
        },
    }
};
API.Request.NewService = API.Type.Service;

API.Request.Search = {
    additionalProperties: false,
    type: 'object',
    properties: {
        type: {
            type: 'string',
            enum: ["spz", "ownerid", "carid"]
        },
        query: {
            type: 'string',
        }
    }
};

API.Type.ID = {
    type: 'string',
    minLength: 24,
    maxLength: 24
};

// Query with ID (for example for a Car)
API.Request.Params.ID = {
    type: 'object',
    properties: {
        id: API.Type.ID
    }
};

module.exports = API;