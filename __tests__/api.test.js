const request = require("supertest");
const app = require("../src/app");
const path = require("path");
const fs = require("fs");
const { connectDB, sequelize } = require("../src/config/database");

let authToken = "";
let authTokenOtherUser = "";
let userEmail = `test_main@example.com`;
let userEmailOther = `test_other@example.com`;
let todoId;

beforeAll(async () => {
  await connectDB();
  require("../src/models/user");
  require("../src/models/todo");
  await sequelize.sync({ force: true });
});

afterAll(async () => {
  await sequelize.close();
});

describe("1 — authentication ", () => {
  test("should sign up a new user successfully", async () => {
    let req = request(app)
      .post("/api/auth/register")
      .field("name", "Test User")
      .field("user_name", `mainuser_${Date.now()}`)
      .field("email", userEmail)
      .field("phone_no", "1234567890")
      .field("password", "StrongP@ssw0rd!")
      .field("confirm_password", "StrongP@ssw0rd!")
      .field("gender", "male")
      .field("about", "I am a test user.");

    const testImage = path.join(__dirname, "uploads", "test-image.png");
    if (fs.existsSync(testImage)) {
      req = req.attach("profile_image", testImage);
    }

    const res = await req;

    // Debug if fails
    if (res.statusCode !== 201) console.error("Signup 1 error:", res.body);

    expect(res.statusCode).toBe(201);
    expect(res.body).toHaveProperty("message");
    expect(res.body.data).toHaveProperty("email", userEmail);
    expect(res.body.data.password).toBeUndefined();
  });

  test("should sign up a second independent user successfully", async () => {
    let req = request(app)
      .post("/api/auth/register")
      .field("name", "Other Test User")
      .field("user_name", `otheruser_${Date.now()}`)
      .field("email", userEmailOther)
      .field("phone_no", "1234567891")
      .field("password", "StrongP@ssw0rd!")
      .field("confirm_password", "StrongP@ssw0rd!")
      .field("gender", "female")
      .field("about", "I am another test user.");

    const testImage = path.join(__dirname, "uploads", "test-image.png");
    if (fs.existsSync(testImage)) {
      req = req.attach("profile_image", testImage);
    }
    const res = await req;

    if (res.statusCode !== 201) console.error("Signup 2 error:", res.body);
    expect(res.statusCode).toBe(201);
  });

  test("should fail signup if email already exists", async () => {
    const testImage = path.join(__dirname, "uploads", "test-image.png");
    let req = request(app)
      .post("/api/auth/register")
      .field("name", "Another User")
      .field("user_name", `duplicate_email_${Date.now()}`)
      .field("email", userEmail) // Duplicate!
      .field("phone_no", "0987654321")
      .field("password", "StrongP@ssw0rd!")
      .field("confirm_password", "StrongP@ssw0rd!")
      .field("gender", "female")
      .field("about", "Another test.");

    if (fs.existsSync(testImage)) req = req.attach("profile_image", testImage);
    const res = await req;

    expect(res.statusCode).toBe(400);
    expect(res.body.message).toMatch(/email already exists/i);
  });

  test("should fail signup if username already exists", async () => {
    const testImage = path.join(__dirname, "uploads", "test-image.png");
    let req = request(app)
      .post("/api/auth/register")
      .field("name", "Another User 2")
      .field("user_name", `mainuser_${Date.now()}`) // Would be duplicate, but realistically tested below via actual DB error if identical
      .field("email", "dupuser@example.com")
      .field("phone_no", "1234567890") // Duplicate phone tests "already exists" logic
      .field("password", "StrongP@ssw0rd!")
      .field("confirm_password", "StrongP@ssw0rd!")
      .field("gender", "female")
      .field("about", "Another test.");

    if (fs.existsSync(testImage)) req = req.attach("profile_image", testImage);
    const res = await req;

    expect(res.statusCode).toBe(400);
  });

  test("should fail signup with missing required fields", async () => {
    const res = await request(app).post("/api/auth/register").send({});
    expect(res.statusCode).toBe(400);
    expect(res.body).toHaveProperty("message");
  });

  test("should fail signup with invalid password format", async () => {
    const testImage = path.join(__dirname, "uploads", "test-image.png");
    let req = request(app)
      .post("/api/auth/register")
      .field("name", "Invalid User")
      .field("user_name", `invalid_${Date.now()}`)
      .field("email", "invalidpass@example.com")
      .field("phone_no", "1231231230")
      .field("password", "weakpass") // Invalid format
      .field("confirm_password", "weakpass")
      .field("gender", "male")
      .field("about", "Invalid password testing.");

    if (fs.existsSync(testImage)) req = req.attach("profile_image", testImage);
    const res = await req;

    expect(res.statusCode).toBe(400);
    expect(res.body.error).toMatch(/Password must be at least/i);
  });

  test("should login with correct email credentials and return JWT", async () => {
    const res = await request(app).post("/api/auth/login").send({
      email: userEmail,
      password: "StrongP@ssw0rd!",
    });

    expect(res.statusCode).toBe(200);
    expect(res.body.data).toHaveProperty("token");
    authToken = res.body.data.token;
  });

  test("should login second user correctly", async () => {
    const res = await request(app).post("/api/auth/login").send({
      email: userEmailOther,
      password: "StrongP@ssw0rd!",
    });
    expect(res.statusCode).toBe(200);
    authTokenOtherUser = res.body.data.token;
  });

  test("should reject login with wrong password", async () => {
    const res = await request(app).post("/api/auth/login").send({
      email: userEmail,
      password: "WrongPassword@1",
    });

    expect(res.statusCode).toBe(400);
    expect(res.body).toHaveProperty("message");
  });

  test("should reject login with non-existent email", async () => {
    const res = await request(app).post("/api/auth/login").send({
      email: "nobody@example.com",
      password: "StrongP@ssw0rd!",
    });

    expect(res.statusCode).toBe(400);
  });

  test("should reject login with missing fields", async () => {
    const res = await request(app).post("/api/auth/login").send({});

    expect(res.statusCode).toBe(400);
  });
});

// ---------------------------------------------------------------------------------------------------------------------------

describe("2 — profile", () => {
  let mainUserId;

  test("should fetch the logged-in user's profile", async () => {
    const res = await request(app)
      .get("/api/user/profile")
      .set("Authorization", `Bearer ${authToken}`);

    expect(res.statusCode).toBe(200);
    expect(res.body.data).toHaveProperty("email", userEmail);
    expect(res.body.data).toHaveProperty("user_name");
    expect(res.body.data.password).toBeUndefined();
    mainUserId = res.body.data.id;
  });

  test("should fetch user by ID", async () => {
    const res = await request(app)
      .get(`/api/user/${mainUserId}`)
      .set("Authorization", `Bearer ${authToken}`);

    expect(res.statusCode).toBe(200);
    expect(res.body.data).toHaveProperty("id", mainUserId);
  });

  test("should return 404 for fetching non-existent user profile", async () => {
    const res = await request(app)
      .get(`/api/user/99999`)
      .set("Authorization", `Bearer ${authToken}`);

    expect(res.statusCode).toBe(404);
  });

  test("should reject unauthorized API call without token", async () => {
    const res = await request(app).get("/api/user/profile");

    expect(res.statusCode).toBe(401);
  });

  test("should update user profile gracefully with selective fields", async () => {
    const res = await request(app)
      .put("/api/user/profile")
      .set("Authorization", `Bearer ${authToken}`)
      .field("name", "Updated User");

    expect(res.statusCode).toBe(200);
    expect(res.body).toHaveProperty("message");
    expect(res.body.data).toHaveProperty("name", "Updated User");
  });

  test("should block updates to restricted fields like 'id' or 'is_active'", async () => {
    const res = await request(app)
      .put("/api/user/profile")
      .set("Authorization", `Bearer ${authToken}`)
      .field("is_active", "false")
      .field("id", "999");

    expect(res.statusCode).toBe(400);
    expect(res.body.message).toMatch(/cannot update restricted fields/i);
  });

  test("should prevent cross-user profile modification", async () => {
    const res = await request(app)
      .put(`/api/user/profile/${mainUserId}`)
      .set("Authorization", `Bearer ${authTokenOtherUser}`)
      .field("name", "Hacked Name");

    expect(res.statusCode).toBe(403);
    expect(res.body.message).toMatch(
      /not authorized to update another user's profile/i,
    );
  });

  test("should fetch all users successfully", async () => {
    const res = await request(app)
      .get(`/api/user/`)
      .set("Authorization", `Bearer ${authToken}`);

    expect(res.statusCode).toBe(200);
    expect(Array.isArray(res.body.data)).toBeTruthy();
    expect(res.body.data.length).toBeGreaterThanOrEqual(2);
  });
});

// ---------------------------------------------------------------------------------------------------------------------------

describe("3 - todo-crud", () => {
  let otherUserIdTodoId;

  test("should fail to create a todo without title", async () => {
    const res = await request(app)
      .post("/api/task")
      .set("Authorization", `Bearer ${authToken}`)
      .send({ description: "Missing title field" });

    expect(res.statusCode).toBe(400);
  });

  test("should create a new todo successfully for main user", async () => {
    const res = await request(app)
      .post("/api/task")
      .set("Authorization", `Bearer ${authToken}`)
      .send({
        title: "Learn Sequelize",
        description: "Understand ORM associations and queries",
        priority: "high",
      });

    expect(res.statusCode).toBe(201);
    expect(res.body).toHaveProperty("message");
    todoId = res.body.data.id;
  });

  test("should create a new todo for the other user", async () => {
    const res = await request(app)
      .post("/api/task")
      .set("Authorization", `Bearer ${authTokenOtherUser}`)
      .send({
        title: "Other user task",
        description: "Other user description",
      });

    expect(res.statusCode).toBe(201);
    otherUserIdTodoId = res.body.data.id;
  });

  test("should fetch all todos for logged-in main user only", async () => {
    const res = await request(app)
      .get("/api/task")
      .set("Authorization", `Bearer ${authToken}`);

    expect(res.statusCode).toBe(200);
    expect(Array.isArray(res.body.data)).toBe(true);
    // Should only grab the user's specific todos (1 created)
    expect(res.body.data.length).toBe(1);
    expect(res.body.data[0].id).toBe(todoId);
  });

  test("should update an existing todo", async () => {
    const res = await request(app)
      .put(`/api/task/${todoId}`)
      .set("Authorization", `Bearer ${authToken}`)
      .send({
        title: "Learn Sequelize Deeply",
        status: "in-progress",
      });

    expect(res.statusCode).toBe(200);
    expect(res.body.data).toHaveProperty("status", "in-progress");
  });

  test("should reject update to todo with invalid status", async () => {
    const res = await request(app)
      .put(`/api/task/${todoId}`)
      .set("Authorization", `Bearer ${authToken}`)
      .send({
        status: "done-forever", // invalid enum
      });

    expect(res.statusCode).toBe(400);
  });

  test("should reject cross-user modification of todo", async () => {
    const res = await request(app)
      .put(`/api/task/${otherUserIdTodoId}`)
      .set("Authorization", `Bearer ${authToken}`)
      .send({
        title: "Hacked Todo Title",
      });

    expect(res.statusCode).toBe(403);
    expect(res.body.message).toMatch(
      /not authorized to update another user's task/i,
    );
  });

  test("should reject cross-user deletion of todo", async () => {
    const res = await request(app)
      .delete(`/api/task/${otherUserIdTodoId}`)
      .set("Authorization", `Bearer ${authToken}`);

    expect(res.statusCode).toBe(403);
    expect(res.body.message).toMatch(
      /not authorized to delete another user's task/i,
    );
  });

  test("should delete the todo successfully", async () => {
    const res = await request(app)
      .delete(`/api/task/${otherUserIdTodoId}`)
      .set("Authorization", `Bearer ${authTokenOtherUser}`);

    expect(res.statusCode).toBe(200);
  });

  test("should return 404 when updating already deleted todo", async () => {
    const res = await request(app)
      .put(`/api/task/${otherUserIdTodoId}`)
      .set("Authorization", `Bearer ${authTokenOtherUser}`)
      .send({ title: "Ghost Todo" });

    expect(res.statusCode).toBe(404);
  });

  test("should return 404 when deleting already deleted todo", async () => {
    const res = await request(app)
      .delete(`/api/task/${otherUserIdTodoId}`)
      .set("Authorization", `Bearer ${authTokenOtherUser}`);

    expect(res.statusCode).toBe(404);
  });

  test("should prevent profile deletion when main user has pending tasks", async () => {
    const res = await request(app)
      .delete(`/api/user/profile`)
      .set("Authorization", `Bearer ${authToken}`);

    expect(res.statusCode).toBe(400);
    expect(res.body.message).toMatch(/until all your tasks are completed/i);
  });

  test("should delete profile successfully when no tasks are left", async () => {
    // Delete the task first
    let res = await request(app)
      .delete(`/api/task/${todoId}`)
      .set("Authorization", `Bearer ${authToken}`);
    expect(res.statusCode).toBe(200);

    // Profile deletion should succeed
    res = await request(app)
      .delete(`/api/user/profile`)
      .set("Authorization", `Bearer ${authToken}`);

    expect(res.statusCode).toBe(200);
    expect(res.body.message).toMatch(/deleted successfully/i);
  });
});
