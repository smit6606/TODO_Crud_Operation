require("dotenv").config();
const { updateProfile } = require("./src/controllers/user");
const UserService = require("./src/services/auth");

async function run() {
    const s = new UserService();
    let user = await s.findByEmail("test@test.com");
    if (!user) {
        user = await s.registerUser({
            name: "Test", email: "test@test.com", user_name: "testuser", phone_no: "1234567890", password: "Password1!", gender: "male"
        });
    }

    const req = {
        user: { id: user.id },
        params: { id: user.id },
        body: { user_name: "newname" },
        file: {
            buffer: Buffer.from("iVBORw0KGgoAAAANSUhEUgAAAAEAAAABCAQAAAC1HAwCAAAAC0lEQVR42mNkYAAAAAYAAjCB0C8AAAAASUVORK5CYII=", "base64"),
            mimetype: "image/png"
        }
    };

    const res = {
        status: (code) => ({
            json: (data) => console.log("Response:", code, data)
        }),
        json: (data) => console.log("Response:", data)
    };

    try {
        await updateProfile(req, res);
    } catch (e) {
        console.error("Test Crash:", e);
    }
}
run();
