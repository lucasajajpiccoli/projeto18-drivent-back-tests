import app, { init } from "@/app";
import faker from "@faker-js/faker";
import { TicketStatus } from "@prisma/client";
import httpStatus from "http-status";
import * as jwt from "jsonwebtoken";
import supertest from "supertest";
import {
  createEnrollmentWithAddress,
  createUser,
  createRemoteTicketType,
  createHostableTicketType,
  createTicket,
  createHotel,
  createHotelWithRoom
} from "../factories";
import { cleanDb, generateValidToken } from "../helpers";

beforeAll(async () => {
  await init();
});

beforeEach(async () => {
  await cleanDb();
});

const server = supertest(app);

describe("GET /hotels", () => {
  it("should respond with status 401 if no token is given", async () => {
    const response = await server.get("/hotels");

    expect(response.status).toBe(httpStatus.UNAUTHORIZED);
  });

  it("should respond with status 401 if given token is not valid", async () => {
    const token = faker.lorem.word();

    const response = await server.get("/hotels").set("Authorization", `Bearer ${token}`);

    expect(response.status).toBe(httpStatus.UNAUTHORIZED);
  });

  it("should respond with status 401 if there is no session for given token", async () => {
    const userWithoutSession = await createUser();
    const token = jwt.sign({ userId: userWithoutSession.id }, process.env.JWT_SECRET);

    const response = await server.get("/hotels").set("Authorization", `Bearer ${token}`);

    expect(response.status).toBe(httpStatus.UNAUTHORIZED);
  });

  describe("when token is valid", () => {
    it("should respond with status 403 when user doesnt have an enrollment yet", async () => {
      const token = await generateValidToken();

      const response = await server.get("/hotels").set("Authorization", `Bearer ${token}`);

      expect(response.status).toBe(httpStatus.FORBIDDEN);
    });

    it("should respond with status 403 when user doesnt have a ticket yet", async () => {
      const user = await createUser();
      const token = await generateValidToken(user);
      await createEnrollmentWithAddress(user);

      const response = await server.get("/hotels").set("Authorization", `Bearer ${token}`);

      expect(response.status).toBe(httpStatus.FORBIDDEN);
    });

    it("should respond with status 403 when user has an unpaid and remote ticket", async () => {
      const user = await createUser();
      const token = await generateValidToken(user);
      const enrollment = await createEnrollmentWithAddress(user);
      const ticketType = await createRemoteTicketType();
      await createTicket(enrollment.id, ticketType.id, TicketStatus.RESERVED);

      const response = await server.get("/hotels").set("Authorization", `Bearer ${token}`);

      expect(response.status).toBe(httpStatus.FORBIDDEN);
    });

    it("should respond with status 403 when user has a paid and remote ticket", async () => {
      const user = await createUser();
      const token = await generateValidToken(user);
      const enrollment = await createEnrollmentWithAddress(user);
      const ticketType = await createRemoteTicketType();
      await createTicket(enrollment.id, ticketType.id, TicketStatus.PAID);

      const response = await server.get("/hotels").set("Authorization", `Bearer ${token}`);

      expect(response.status).toBe(httpStatus.FORBIDDEN);
    });

    it("should respond with status 403 when user has an unpaid and hostable ticket", async () => {
      const user = await createUser();
      const token = await generateValidToken(user);
      const enrollment = await createEnrollmentWithAddress(user);
      const ticketType = await createHostableTicketType();
      await createTicket(enrollment.id, ticketType.id, TicketStatus.RESERVED);

      const response = await server.get("/hotels").set("Authorization", `Bearer ${token}`);

      expect(response.status).toBe(httpStatus.FORBIDDEN);
    });

    describe("when user is allowed to access the content", () => {
      it("should respond with status 200 and empty array when there are no hotels", async () => {
        const user = await createUser();
        const token = await generateValidToken(user);
        const enrollment = await createEnrollmentWithAddress(user);
        const ticketType = await createHostableTicketType();
        await createTicket(enrollment.id, ticketType.id, TicketStatus.PAID);

        const response = await server.get("/hotels").set("Authorization", `Bearer ${token}`);

        expect(response.status).toBe(httpStatus.OK);
        expect(response.body).toEqual([]);
      });

      it("should respond with status 200 and hotels data when there are hotels", async () => {
        const user = await createUser();
        const token = await generateValidToken(user);
        const enrollment = await createEnrollmentWithAddress(user);
        const ticketType = await createHostableTicketType();
        await createTicket(enrollment.id, ticketType.id, TicketStatus.PAID);
        const hotel = await createHotel();

        const response = await server.get("/hotels").set("Authorization", `Bearer ${token}`);

        expect(response.status).toBe(httpStatus.OK);
        expect(response.body).toEqual([
          {
            id: hotel.id,
            name: hotel.name,
            image: hotel.image,
            createdAt: hotel.createdAt.toISOString(),
            updatedAt: hotel.updatedAt.toISOString(),
          },
        ]);
      });
    });
  });
});

describe("GET /hotels/:hotelId", () => {
  const validHotelId = faker.datatype.number().toString();
  const invalidHotelId = faker.lorem.word();

  it("should respond with status 401 if no token is given", async () => {
    const response = await server.get(`/hotels/${validHotelId}`);

    expect(response.status).toBe(httpStatus.UNAUTHORIZED);
  });

  it("should respond with status 401 if given token is not valid", async () => {
    const token = faker.lorem.word();

    const response = await server.get(`/hotels/${validHotelId}`).set("Authorization", `Bearer ${token}`);

    expect(response.status).toBe(httpStatus.UNAUTHORIZED);
  });

  it("should respond with status 401 if there is no session for given token", async () => {
    const userWithoutSession = await createUser();
    const token = jwt.sign({ userId: userWithoutSession.id }, process.env.JWT_SECRET);

    const response = await server.get(`/hotels/${validHotelId}`).set("Authorization", `Bearer ${token}`);

    expect(response.status).toBe(httpStatus.UNAUTHORIZED);
  });

  describe("when token is valid", () => {
    it("should respond with status 400 if hotelId format is not valid", async () => {
      const token = await generateValidToken();

      const response = await server.get(`/hotels/${invalidHotelId}`).set("Authorization", `Bearer ${token}`);

      expect(response.status).toBe(httpStatus.BAD_REQUEST);
    });

    describe("when hotelId format is valid", () => {
      it("should respond with status 403 when user doesnt have an enrollment yet", async () => {
        const token = await generateValidToken();
  
        const response = await server.get(`/hotels/${validHotelId}`).set("Authorization", `Bearer ${token}`);
  
        expect(response.status).toBe(httpStatus.FORBIDDEN);
      });

      it("should respond with status 403 when user doesnt have a ticket yet", async () => {
        const user = await createUser();
        const token = await generateValidToken(user);
        await createEnrollmentWithAddress(user);

        const response = await server.get(`/hotels/${validHotelId}`).set("Authorization", `Bearer ${token}`);

        expect(response.status).toBe(httpStatus.FORBIDDEN);
      });

      it("should respond with status 403 when user has an unpaid and remote ticket", async () => {
        const user = await createUser();
        const token = await generateValidToken(user);
        const enrollment = await createEnrollmentWithAddress(user);
        const ticketType = await createRemoteTicketType();
        await createTicket(enrollment.id, ticketType.id, TicketStatus.RESERVED);

        const response = await server.get(`/hotels/${validHotelId}`).set("Authorization", `Bearer ${token}`);

        expect(response.status).toBe(httpStatus.FORBIDDEN);
      });

      it("should respond with status 403 when user has a paid and remote ticket", async () => {
        const user = await createUser();
        const token = await generateValidToken(user);
        const enrollment = await createEnrollmentWithAddress(user);
        const ticketType = await createRemoteTicketType();
        await createTicket(enrollment.id, ticketType.id, TicketStatus.PAID);

        const response = await server.get(`/hotels/${validHotelId}`).set("Authorization", `Bearer ${token}`);

        expect(response.status).toBe(httpStatus.FORBIDDEN);
      });

      it("should respond with status 403 when user has an unpaid and hostable ticket", async () => {
        const user = await createUser();
        const token = await generateValidToken(user);
        const enrollment = await createEnrollmentWithAddress(user);
        const ticketType = await createHostableTicketType();
        await createTicket(enrollment.id, ticketType.id, TicketStatus.RESERVED);

        const response = await server.get(`/hotels/${validHotelId}`).set("Authorization", `Bearer ${token}`);

        expect(response.status).toBe(httpStatus.FORBIDDEN);
      });

      describe("when user is allowed to access the content", () => {
        it("should respond with status 404 when there are no hotels", async () => {
          const user = await createUser();
          const token = await generateValidToken(user);
          const enrollment = await createEnrollmentWithAddress(user);
          const ticketType = await createHostableTicketType();
          await createTicket(enrollment.id, ticketType.id, TicketStatus.PAID);

          const response = await server.get(`/hotels/${validHotelId}`).set("Authorization", `Bearer ${token}`);

          expect(response.status).toBe(httpStatus.NOT_FOUND);
        });

        it("should respond with status 404 when there are hotels and none of them matches given hotelId", async () => {
          const user = await createUser();
          const token = await generateValidToken(user);
          const enrollment = await createEnrollmentWithAddress(user);
          const ticketType = await createHostableTicketType();
          await createTicket(enrollment.id, ticketType.id, TicketStatus.PAID);
          const hotel = await createHotel();
          const inexistentHotelId = hotel.id + 1;

          const response = await server.get(`/hotels/${inexistentHotelId}`).set("Authorization", `Bearer ${token}`);

          expect(response.status).toBe(httpStatus.NOT_FOUND);
        });

        describe("when given hotelId matches an existent hotel", () => {
          it("should respond with status 200 and empty array on rooms when hotel doesnt have rooms", async () => {
            const user = await createUser();
            const token = await generateValidToken(user);
            const enrollment = await createEnrollmentWithAddress(user);
            const ticketType = await createHostableTicketType();
            await createTicket(enrollment.id, ticketType.id, TicketStatus.PAID);
            const hotel = await createHotel();

            const response = await server.get(`/hotels/${hotel.id}`).set("Authorization", `Bearer ${token}`);
  
            expect(response.status).toBe(httpStatus.OK);
            expect(response.body).toEqual({
              id: hotel.id,
              name: hotel.name,
              image: hotel.image,
              createdAt: hotel.createdAt.toISOString(),
              updatedAt: hotel.updatedAt.toISOString(),
              Rooms: [],
            });
          });
  
          it("should respond with status 200 and hotels with rooms data when there are hotels with rooms", async () => {
            const user = await createUser();
            const token = await generateValidToken(user);
            const enrollment = await createEnrollmentWithAddress(user);
            const ticketType = await createHostableTicketType();
            await createTicket(enrollment.id, ticketType.id, TicketStatus.PAID);
            const hotelWithRoom = await createHotelWithRoom();

            const response = await server.get(`/hotels/${hotelWithRoom.id}`).set("Authorization", `Bearer ${token}`);
  
            expect(response.status).toBe(httpStatus.OK);
            expect(response.body).toEqual({
              id: hotelWithRoom.id,
              name: hotelWithRoom.name,
              image: hotelWithRoom.image,
              createdAt: hotelWithRoom.createdAt.toISOString(),
              updatedAt: hotelWithRoom.updatedAt.toISOString(),
              Rooms: [
                {
                  id: hotelWithRoom.Rooms[0].id,
                  name: hotelWithRoom.Rooms[0].name,
                  capacity: hotelWithRoom.Rooms[0].capacity,
                  hotelId: hotelWithRoom.Rooms[0].hotelId,
                  createdAt: hotelWithRoom.createdAt.toISOString(),
                  updatedAt: hotelWithRoom.updatedAt.toISOString(),
                },
              ],
            });
          });
        });
      });
    });
  });
});
