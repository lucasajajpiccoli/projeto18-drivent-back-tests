import { prisma } from "@/config";
import { Prisma } from "@prisma/client";

async function findByEmail(email: string, select?: Prisma.UserSelect) {
  const params: Prisma.UserFindUniqueArgs = {
    where: {
      email,
    },
  };

  if (select) {
    params.select = select;
  }

  return prisma.user.findUnique(params);
}

async function findUserWithTicketTypeByUserId(userId: number) {
  return prisma.user.findFirst({
    include: {
      Enrollment: {
        include: {
          Ticket: {
            include: {
              TicketType: true
            }
          }
        }
      }
    }
  });
}

async function create(data: Prisma.UserUncheckedCreateInput) {
  return prisma.user.create({
    data,
  });
}

const userRepository = {
  findByEmail,
  findUserWithTicketTypeByUserId,
  create,
};

export default userRepository;
