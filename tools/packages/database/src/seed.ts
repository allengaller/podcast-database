import { prisma } from './index';
import { LeetCodeGraphQLClient, stripHtml } from '@leetcast/core';

async function main() {
  console.log('Fetching LeetCode problems...');
  const list = await LeetCodeGraphQLClient.getProblemList(100);
  console.log(`Found ${list.length} problems. Fetching details...`);

  for (let i = 0; i < list.length; i++) {
    const p = list[i];
    console.log(`[${i + 1}/${list.length}] ${p.title}`);

    try {
      const detail = await LeetCodeGraphQLClient.getProblemDetail(p.titleSlug);
      const description = stripHtml(detail.content || '');

      await prisma.problem.upsert({
        where: { id: detail.questionFrontendId },
        update: {
          title: detail.title,
          titleSlug: detail.titleSlug,
          difficulty: detail.difficulty,
          topics: detail.topicTags.map((t: { name: string }) => t.name),
          description,
          acceptanceRate: String(p.acRate),
          hints: detail.hints || [],
          solution: detail.solution?.content || undefined,
        },
        create: {
          id: detail.questionFrontendId,
          title: detail.title,
          titleSlug: detail.titleSlug,
          difficulty: detail.difficulty,
          topics: detail.topicTags.map((t: { name: string }) => t.name),
          description,
          acceptanceRate: String(p.acRate),
          hints: detail.hints || [],
          solution: detail.solution?.content || undefined,
        },
      });
    } catch (err) {
      console.error(`Failed to fetch details for ${p.title}:`, err);
    }
  }

  console.log('Seed completed.');
}

main()
  .catch((e) => {
    console.error(e);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
