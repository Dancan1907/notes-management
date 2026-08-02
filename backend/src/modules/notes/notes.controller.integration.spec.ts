// backend/src/modules/notes/notes.controller.integration.spec.ts

import { Test, TestingModule } from "@nestjs/testing";
import { INestApplication, ValidationPipe } from "@nestjs/common";
import * as request from "supertest";
import { AppModule } from "../../app.module";
import { PrismaService } from "../prisma/prisma.service";
import { AuthService } from "../auth/auth.service";
import { NoteFactory } from "../../../test/factories/note.factory";

describe("NotesController (Integration)", () => {
  let app: INestApplication;
  let prisma: PrismaService;
  let authService: AuthService;
  let noteFactory: NoteFactory;
  let accessToken: string;
  let testUser: any;
  let testUserId: string;

  beforeAll(async () => {
    const moduleFixture: TestingModule = await Test.createTestingModule({
      imports: [AppModule],
    }).compile();

    app = moduleFixture.createNestApplication();
    app.useGlobalPipes(new ValidationPipe());

    prisma = app.get<PrismaService>(PrismaService);
    authService = app.get<AuthService>(AuthService);
    noteFactory = new NoteFactory(prisma);

    await app.init();
  });

  beforeAll(async () => {
    // Create a test user
    const email = `test-user-${Date.now()}@example.com`;
    const password = "TestPassword123!";

    testUser = await authService.register({
      email,
      password,
      name: "Test User",
    });

    testUserId = testUser.id;

    // Login to get access token
    const loginResult = await authService.login({
      email,
      password,
    });

    accessToken = loginResult.accessToken;
  });

  afterAll(async () => {
    // Clean up test data
    await noteFactory.cleanup(testUserId);
    await prisma.user.delete({ where: { id: testUserId } });
    await prisma.$disconnect();
    await app.close();
  });

  describe("POST /notes", () => {
    it("should create a note with valid data", async () => {
      const response = await request(app.getHttpServer())
        .post("/api/v1/notes")
        .set("Authorization", `Bearer ${accessToken}`)
        .send({
          title: "Integration Test Note",
          content: "This is an integration test note",
          color: "#ff6b6b",
        })
        .expect(201);

      expect(response.body).toHaveProperty("id");
      expect(response.body.title).toBe("Integration Test Note");
      expect(response.body.content).toBe("This is an integration test note");
      expect(response.body.color).toBe("#ff6b6b");
      expect(response.body.isFavorite).toBe(false);
      expect(response.body.isArchived).toBe(false);
      expect(response.body).toHaveProperty("createdAt");
      expect(response.body).toHaveProperty("updatedAt");

      // Cleanup
      await prisma.note.delete({ where: { id: response.body.id } });
    });

    it("should return 400 when title is missing", async () => {
      await request(app.getHttpServer())
        .post("/api/v1/notes")
        .set("Authorization", `Bearer ${accessToken}`)
        .send({
          content: "Missing title",
        })
        .expect(400);
    });

    it("should return 401 when no token provided", async () => {
      await request(app.getHttpServer())
        .post("/api/v1/notes")
        .send({
          title: "Unauthorized Test",
        })
        .expect(401);
    });
  });

  describe("GET /notes", () => {
    let createdNotes: any[] = [];

    beforeAll(async () => {
      // Create test notes
      createdNotes = await noteFactory.createManyNotes(testUserId, 5);
    });

    afterAll(async () => {
      // Cleanup
      await noteFactory.cleanup(testUserId);
    });

    it("should get all notes for authenticated user", async () => {
      const response = await request(app.getHttpServer())
        .get("/api/v1/notes")
        .set("Authorization", `Bearer ${accessToken}`)
        .expect(200);

      expect(response.body).toHaveProperty("data");
      expect(response.body).toHaveProperty("total");
      expect(response.body).toHaveProperty("limit");
      expect(response.body).toHaveProperty("offset");
      expect(response.body).toHaveProperty("hasMore");
      expect(response.body.data).toBeInstanceOf(Array);
      expect(response.body.data.length).toBeGreaterThanOrEqual(5);
    });

    it("should filter notes by isArchived", async () => {
      // Archive a note
      const noteToArchive = createdNotes[0];
      await prisma.note.update({
        where: { id: noteToArchive.id },
        data: { isArchived: true },
      });

      const response = await request(app.getHttpServer())
        .get("/api/v1/notes?isArchived=true")
        .set("Authorization", `Bearer ${accessToken}`)
        .expect(200);

      expect(
        response.body.data.some((n: any) => n.id === noteToArchive.id),
      ).toBe(true);
    });

    it("should filter notes by isFavorite", async () => {
      // Favorite a note
      const noteToFavorite = createdNotes[1];
      await prisma.note.update({
        where: { id: noteToFavorite.id },
        data: { isFavorite: true },
      });

      const response = await request(app.getHttpServer())
        .get("/api/v1/notes?isFavorite=true")
        .set("Authorization", `Bearer ${accessToken}`)
        .expect(200);

      expect(
        response.body.data.some((n: any) => n.id === noteToFavorite.id),
      ).toBe(true);
    });

    it("should search notes by title", async () => {
      const searchTerm = "Test Note 1";
      const response = await request(app.getHttpServer())
        .get(`/api/v1/notes?search=${searchTerm}`)
        .set("Authorization", `Bearer ${accessToken}`)
        .expect(200);

      expect(
        response.body.data.some((n: any) => n.title.includes(searchTerm)),
      ).toBe(true);
    });

    it("should handle pagination", async () => {
      const response = await request(app.getHttpServer())
        .get("/api/v1/notes?limit=2&offset=0")
        .set("Authorization", `Bearer ${accessToken}`)
        .expect(200);

      expect(response.body.data.length).toBeLessThanOrEqual(2);
      expect(response.body.limit).toBe(2);
      expect(response.body.offset).toBe(0);
    });
  });

  describe("GET /notes/:id", () => {
    let testNote: any;

    beforeAll(async () => {
      testNote = await noteFactory.createNote(testUserId);
    });

    afterAll(async () => {
      await noteFactory.cleanup(testUserId);
    });

    it("should get a note by ID", async () => {
      const response = await request(app.getHttpServer())
        .get(`/api/v1/notes/${testNote.id}`)
        .set("Authorization", `Bearer ${accessToken}`)
        .expect(200);

      expect(response.body.id).toBe(testNote.id);
      expect(response.body.title).toBe(testNote.title);
      expect(response.body.content).toBe(testNote.content);
    });

    it("should return 404 for non-existent note", async () => {
      await request(app.getHttpServer())
        .get("/api/v1/notes/non-existent-id")
        .set("Authorization", `Bearer ${accessToken}`)
        .expect(404);
    });
  });

  describe("PATCH /notes/:id", () => {
    let testNote: any;

    beforeAll(async () => {
      testNote = await noteFactory.createNote(testUserId);
    });

    afterAll(async () => {
      await noteFactory.cleanup(testUserId);
    });

    it("should update a note", async () => {
      const response = await request(app.getHttpServer())
        .patch(`/api/v1/notes/${testNote.id}`)
        .set("Authorization", `Bearer ${accessToken}`)
        .send({
          title: "Updated Integration Test Note",
          content: "Updated content",
          color: "#4ecdc4",
        })
        .expect(200);

      expect(response.body.title).toBe("Updated Integration Test Note");
      expect(response.body.content).toBe("Updated content");
      expect(response.body.color).toBe("#4ecdc4");
    });

    it("should toggle favorite", async () => {
      const response = await request(app.getHttpServer())
        .patch(`/api/v1/notes/${testNote.id}`)
        .set("Authorization", `Bearer ${accessToken}`)
        .send({
          isFavorite: true,
        })
        .expect(200);

      expect(response.body.isFavorite).toBe(true);
    });

    it("should toggle archive", async () => {
      const response = await request(app.getHttpServer())
        .patch(`/api/v1/notes/${testNote.id}`)
        .set("Authorization", `Bearer ${accessToken}`)
        .send({
          isArchived: true,
        })
        .expect(200);

      expect(response.body.isArchived).toBe(true);
    });
  });

  describe("PATCH /notes/:id/favorite", () => {
    let testNote: any;

    beforeAll(async () => {
      testNote = await noteFactory.createNote(testUserId, {
        isFavorite: false,
      });
    });

    afterAll(async () => {
      await noteFactory.cleanup(testUserId);
    });

    it("should toggle favorite status", async () => {
      const response = await request(app.getHttpServer())
        .patch(`/api/v1/notes/${testNote.id}/favorite`)
        .set("Authorization", `Bearer ${accessToken}`)
        .expect(200);

      expect(response.body.isFavorite).toBe(true);
    });

    it("should toggle favorite back to false", async () => {
      const response = await request(app.getHttpServer())
        .patch(`/api/v1/notes/${testNote.id}/favorite`)
        .set("Authorization", `Bearer ${accessToken}`)
        .expect(200);

      expect(response.body.isFavorite).toBe(false);
    });
  });

  describe("PATCH /notes/:id/archive", () => {
    let testNote: any;

    beforeAll(async () => {
      testNote = await noteFactory.createNote(testUserId, {
        isArchived: false,
      });
    });

    afterAll(async () => {
      await noteFactory.cleanup(testUserId);
    });

    it("should toggle archive status", async () => {
      const response = await request(app.getHttpServer())
        .patch(`/api/v1/notes/${testNote.id}/archive`)
        .set("Authorization", `Bearer ${accessToken}`)
        .expect(200);

      expect(response.body.isArchived).toBe(true);
    });

    it("should toggle archive back to false", async () => {
      const response = await request(app.getHttpServer())
        .patch(`/api/v1/notes/${testNote.id}/archive`)
        .set("Authorization", `Bearer ${accessToken}`)
        .expect(200);

      expect(response.body.isArchived).toBe(false);
    });
  });

  describe("DELETE /notes/:id", () => {
    let testNote: any;

    beforeAll(async () => {
      testNote = await noteFactory.createNote(testUserId);
    });

    it("should delete a note", async () => {
      await request(app.getHttpServer())
        .delete(`/api/v1/notes/${testNote.id}`)
        .set("Authorization", `Bearer ${accessToken}`)
        .expect(204);
    });

    it("should return 404 when deleting non-existent note", async () => {
      await request(app.getHttpServer())
        .delete(`/api/v1/notes/${testNote.id}`)
        .set("Authorization", `Bearer ${accessToken}`)
        .expect(404);
    });
  });

  describe("Rate Limiting", () => {
    it("should apply rate limiting to POST /notes", async () => {
      // Make multiple rapid requests to trigger rate limiting
      const promises = [];
      for (let i = 0; i < 35; i++) {
        promises.push(
          request(app.getHttpServer())
            .post("/api/v1/notes")
            .set("Authorization", `Bearer ${accessToken}`)
            .send({
              title: `Rate Limit Test ${i}`,
            }),
        );
      }

      const responses = await Promise.all(promises);
      const rateLimited = responses.some((res) => res.status === 429);
      expect(rateLimited).toBe(true);
    });
  });
});
