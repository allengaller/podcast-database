#!/usr/bin/env node
import 'dotenv/config';
import { Command } from 'commander';
import chalk from 'chalk';
import { LeetCodeService, MCPService } from '@leetcast/core';
import { AudioService } from './services/audio';
import prompts from 'prompts';

const program = new Command();

program
  .name('leetcast')
  .description('LeetCast: Listen to LeetCode problem explanations as podcasts.')
  .version('1.0.0');

program
  .command('list')
  .description('List popular LeetCode problems')
  .action(async () => {
    const problems = await LeetCodeService.getPopularProblems();
    console.log(chalk.bold.blue('\n--- Popular LeetCode Problems ---\n'));
    problems.forEach(p => {
      const difficultyColor = p.difficulty === 'Easy' ? chalk.green : (p.difficulty === 'Medium' ? chalk.yellow : chalk.red);
      console.log(`${chalk.bold(p.id.padStart(3))} | ${p.title.padEnd(40)} | ${difficultyColor(p.difficulty)}`);
    });
    console.log('');
  });

program
  .command('listen <id>')
  .description('Generate and listen to a podcast for a specific problem')
  .action(async (id) => {
    const problem = await LeetCodeService.getProblemById(id);
    if (!problem) {
      console.error(chalk.red(`Problem with ID ${id} not found.`));
      return;
    }

    console.log(chalk.cyan(`Selected: ${problem.title} (${problem.difficulty})`));
    
    try {
      const podcast = await MCPService.generatePodcast(problem);
      console.log(chalk.green(`Podcast generated: ${podcast.title}`));
      
      const filePath = await AudioService.downloadAudio(podcast.audioUrl, `lc-${id}.mp3`);
      await AudioService.playAudio(filePath);
    } catch (error) {
      console.error(chalk.red(`Error: ${error}`));
    }
  });

program
  .command('search <query>')
  .description('Search for problems by title or topic')
  .action(async (query) => {
    const results = await LeetCodeService.searchProblems(query);
    if (results.length === 0) {
      console.log(chalk.yellow(`No problems found matching "${query}"`));
      return;
    }

    console.log(chalk.bold.blue(`\n--- Search Results for "${query}" ---\n`));
    results.forEach(p => {
      const difficultyColor = p.difficulty === 'Easy' ? chalk.green : (p.difficulty === 'Medium' ? chalk.yellow : chalk.red);
      console.log(`${chalk.bold(p.id.padStart(3))} | ${p.title.padEnd(40)} | ${difficultyColor(p.difficulty)}`);
    });
    console.log('');
  });

program
  .command('interactive')
  .alias('i')
  .description('Start interactive mode')
  .action(async () => {
    const problems = await LeetCodeService.getPopularProblems();
    const response = await prompts({
      type: 'select',
      name: 'problem',
      message: 'Select a problem to listen to:',
      choices: problems.map(p => ({
        title: `${p.id} - ${p.title} (${p.difficulty})`,
        value: p
      }))
    });

    if (response.problem) {
      const p = response.problem;
      const podcast = await MCPService.generatePodcast(p);
      const filePath = await AudioService.downloadAudio(podcast.audioUrl, `lc-${p.id}.mp3`);
      await AudioService.playAudio(filePath);
    }
  });

program.parse(process.argv);

if (!process.argv.slice(2).length) {
  program.outputHelp();
}
