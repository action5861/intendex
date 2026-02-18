/**
 * 사용자를 admin으로 승격시키는 스크립트
 * 사용법: npx tsx scripts/promote-admin.ts <이메일>
 * 예: npx tsx scripts/promote-admin.ts user@example.com
 */
import "dotenv/config";
import { PrismaClient } from "../src/generated/prisma/client";

const prisma = new PrismaClient();

async function main() {
  const email = process.argv[2];
  if (!email) {
    console.error("사용법: npx tsx scripts/promote-admin.ts <이메일>");
    console.error("예: npx tsx scripts/promote-admin.ts user@example.com");
    process.exit(1);
  }

  const user = await prisma.user.update({
    where: { email },
    data: { role: "admin" },
  });

  console.log(`✓ ${user.email ?? user.id} 사용자가 admin으로 설정되었습니다.`);
  console.log("  로그아웃 후 다시 로그인하면 사이드바에 관리 메뉴가 표시됩니다.");
}

main()
  .catch((e) => {
    if (e.code === "P2025") {
      console.error(`해당 이메일을 가진 사용자를 찾을 수 없습니다: ${process.argv[2]}`);
    } else {
      console.error(e);
    }
    process.exit(1);
  })
  .finally(() => prisma.$disconnect());
