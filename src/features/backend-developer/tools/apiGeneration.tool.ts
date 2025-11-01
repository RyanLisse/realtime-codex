import type { BackendArtifact, BackendTask } from "../types";

export async function apiGenerationTool(
  task: BackendTask
): Promise<BackendArtifact> {
  const requirements = task.requirements.toLowerCase();

  // Parse requirements to extract API information
  const endpoints = extractEndpoints(task.requirements);
  const apis = generateAPISpecs(endpoints, requirements);
  const databaseSchemas = generateDatabaseSchemas(requirements);
  const code = generateCode(apis, requirements);

  return {
    id: generateArtifactId(task.id),
    workflowTaskId: task.id,
    apis,
    endpoints,
    databaseSchemas,
    code,
    metadata: {
      workflowId: task.workflowId,
      agentType: "BackendDeveloper",
      version: 1,
      createdAt: new Date(),
      updatedAt: new Date(),
    },
  };
}

function extractEndpoints(
  requirements: string
): Array<{ method: string; path: string; description: string }> {
  const endpoints: Array<{
    method: string;
    path: string;
    description: string;
  }> = [];
  const lowerReq = requirements.toLowerCase();

  // Extract common patterns
  if (lowerReq.includes("login") || lowerReq.includes("authenticate")) {
    endpoints.push({
      method: "POST",
      path: "/auth/login",
      description: "User login endpoint",
    });
  }

  if (
    lowerReq.includes("register") ||
    lowerReq.includes("signup") ||
    lowerReq.includes("sign up")
  ) {
    endpoints.push({
      method: "POST",
      path: "/auth/register",
      description: "User registration endpoint",
    });
  }

  if (lowerReq.includes("logout")) {
    endpoints.push({
      method: "POST",
      path: "/auth/logout",
      description: "User logout endpoint",
    });
  }

  if (lowerReq.includes("profile") || lowerReq.includes("user data")) {
    endpoints.push({
      method: "GET",
      path: "/users/profile",
      description: "Get user profile",
    });
    endpoints.push({
      method: "PUT",
      path: "/users/profile",
      description: "Update user profile",
    });
  }

  if (lowerReq.includes("get") && lowerReq.includes("user")) {
    endpoints.push({
      method: "GET",
      path: "/users/:id",
      description: "Get user by ID",
    });
  }

  if (lowerReq.includes("list") || lowerReq.includes("all users")) {
    endpoints.push({
      method: "GET",
      path: "/users",
      description: "Get all users",
    });
  }

  if (lowerReq.includes("create") && lowerReq.includes("user")) {
    endpoints.push({
      method: "POST",
      path: "/users",
      description: "Create new user",
    });
  }

  if (lowerReq.includes("update") && lowerReq.includes("user")) {
    endpoints.push({
      method: "PATCH",
      path: "/users/:id",
      description: "Update user",
    });
  }

  if (lowerReq.includes("delete") && lowerReq.includes("user")) {
    endpoints.push({
      method: "DELETE",
      path: "/users/:id",
      description: "Delete user",
    });
  }

  return endpoints;
}

function generateAPISpecs(
  endpoints: Array<{ method: string; path: string; description: string }>,
  _requirements: string
): BackendArtifact["apis"] {
  return endpoints.map((endpoint, idx) => {
    const parameters: BackendArtifact["apis"][0]["parameters"] = [];
    const responses: BackendArtifact["apis"][0]["responses"] = [];

    // Extract path parameters
    const pathParams = endpoint.path.match(/:(\w+)/g);
    if (pathParams) {
      pathParams.forEach((param) => {
        const paramName = param.replace(":", "");
        parameters.push({
          name: paramName,
          type: "string",
          required: true,
          location: "path",
          description: `The ${paramName} parameter`,
        });
      });
    }

    // Extract query parameters for GET requests
    if (endpoint.method === "GET" && endpoint.path.includes("/users")) {
      parameters.push({
        name: "limit",
        type: "number",
        required: false,
        location: "query",
        description: "Number of items to return",
      });
      parameters.push({
        name: "offset",
        type: "number",
        required: false,
        location: "query",
        description: "Number of items to skip",
      });
    }

    // Generate request body for POST/PUT/PATCH
    let requestBody: BackendArtifact["apis"][0]["requestBody"] | undefined;
    if (["POST", "PUT", "PATCH"].includes(endpoint.method)) {
      requestBody = generateRequestBody(endpoint);
    }

    // Generate standard responses
    if (endpoint.method === "GET") {
      responses.push({
        statusCode: 200,
        description: "Success",
      });
      responses.push({
        statusCode: 404,
        description: "Not found",
      });
    } else if (endpoint.method === "POST") {
      responses.push({
        statusCode: 201,
        description: "Created successfully",
      });
      responses.push({
        statusCode: 400,
        description: "Bad request",
      });
    } else if (endpoint.method === "PUT" || endpoint.method === "PATCH") {
      responses.push({
        statusCode: 200,
        description: "Updated successfully",
      });
      responses.push({
        statusCode: 404,
        description: "Not found",
      });
    } else if (endpoint.method === "DELETE") {
      responses.push({
        statusCode: 204,
        description: "Deleted successfully",
      });
      responses.push({
        statusCode: 404,
        description: "Not found",
      });
    }

    // Determine authentication
    let authentication: "none" | "bearer" | "api_key" | "oauth" = "none";
    if (
      endpoint.path.includes("/auth/") ||
      endpoint.path.includes("/users/") ||
      endpoint.path.includes("/users?")
    ) {
      authentication = "bearer";
    }

    return {
      id: `api-${idx + 1}`,
      endpoint: endpoint.path,
      method: endpoint.method as any,
      description: endpoint.description,
      parameters,
      requestBody,
      responses,
      authentication,
    };
  });
}

function generateRequestBody(endpoint: {
  method: string;
  path: string;
  description: string;
}): BackendArtifact["apis"][0]["requestBody"] {
  if (endpoint.path.includes("/login")) {
    return {
      type: "object",
      schema: {
        type: "object",
        required: ["email", "password"],
        properties: {
          email: { type: "string", format: "email" },
          password: { type: "string", format: "password" },
        },
      },
    };
  }

  if (endpoint.path.includes("/register")) {
    return {
      type: "object",
      schema: {
        type: "object",
        required: ["email", "password", "name"],
        properties: {
          name: { type: "string" },
          email: { type: "string", format: "email" },
          password: { type: "string", format: "password" },
        },
      },
    };
  }

  if (
    endpoint.path.includes("/users") &&
    ["POST", "PUT", "PATCH"].includes(endpoint.method)
  ) {
    return {
      type: "object",
      schema: {
        type: "object",
        properties: {
          name: { type: "string" },
          email: { type: "string", format: "email" },
          age: { type: "number" },
        },
      },
    };
  }

  return {
    type: "object",
  };
}

function generateDatabaseSchemas(
  requirements: string
): BackendArtifact["databaseSchemas"] {
  const schemas: BackendArtifact["databaseSchemas"] = [];
  const lowerReq = requirements.toLowerCase();

  if (
    lowerReq.includes("user") &&
    (lowerReq.includes("table") || lowerReq.includes("database"))
  ) {
    schemas.push({
      id: "schema-users",
      tableName: "users",
      columns: [
        {
          name: "id",
          type: "UUID",
          nullable: false,
          primaryKey: true,
        },
        {
          name: "email",
          type: "VARCHAR(255)",
          nullable: false,
          unique: true,
        },
        {
          name: "password",
          type: "VARCHAR(255)",
          nullable: false,
        },
        {
          name: "name",
          type: "VARCHAR(255)",
          nullable: true,
        },
        {
          name: "created_at",
          type: "TIMESTAMP",
          nullable: false,
          default: "CURRENT_TIMESTAMP",
        },
        {
          name: "updated_at",
          type: "TIMESTAMP",
          nullable: false,
          default: "CURRENT_TIMESTAMP",
        },
      ],
      indexes: [
        {
          name: "idx_users_email",
          columns: ["email"],
          unique: true,
        },
      ],
    });
  }

  return schemas;
}

function generateCode(
  apis: BackendArtifact["apis"],
  _requirements: string
): BackendArtifact["code"] {
  const code: BackendArtifact["code"] = [];

  if (apis.length === 0) {
    return code;
  }

  // Generate route handler file
  const routeHandlers = apis
    .map(
      (
        api
      ) => `  ${api.method.toLowerCase()}('${api.endpoint}', async (req, res) => {
    try {
      // TODO: Implement ${api.description}
      res.status(200).json({ message: '${api.description}' });
    } catch (error) {
      res.status(500).json({ error: 'Internal server error' });
    }
  });`
    )
    .join("\n\n");

  code.push({
    id: "code-routes",
    fileName: "routes.ts",
    filePath: "src/routes/index.ts",
    code: `import express from 'express';

const router = express.Router();

${routeHandlers}

export default router;`,
    language: "typescript",
  });

  return code;
}

function generateArtifactId(taskId: string): string {
  return `backend-artifact-${taskId}`;
}
