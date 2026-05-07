import * as stringSimilarity from 'string-similarity';

export interface ScoredCandidate {
  locator: string;
  score: number;
  reason: string;
}

export class SimilarityEngine {
  calculateSimilarity(str1: string, str2: string): number {
    if (str1 === str2) return 1.0;
    if (!str1 || !str2) return 0.0;

    return stringSimilarity.compareTwoStrings(str1, str2);
  }

  private levenshteinDistance(str1: string, str2: string): number {
    const matrix = [];

    for (let i = 0; i <= str1.length; i++) {
      matrix[i] = [i];
    }

    for (let j = 0; j <= str2.length; j++) {
      matrix[0][j] = j;
    }

    for (let i = 1; i <= str1.length; i++) {
      for (let j = 1; j <= str2.length; j++) {
        const cost = str1[i - 1] === str2[j - 1] ? 0 : 1;
        matrix[i][j] = Math.min(
          matrix[i - 1][j] + 1,
          matrix[i][j - 1] + 1,
          matrix[i - 1][j - 1] + cost
        );
      }
    }

    return matrix[str1.length][str2.length];
  }

  findBestMatch(failedLocator: string, candidates: string[], threshold: number = 0.7): string | null {
    let bestMatch: string | null = null;
    let bestScore = 0;

    for (const candidate of candidates) {
      const score = this.calculateSimilarity(failedLocator, candidate);
      if (score > bestScore && score >= threshold) {
        bestScore = score;
        bestMatch = candidate;
      }
    }

    return bestMatch;
  }

  findBestMatchWithDetails(
    failedElement: any,
    candidateElements: any[],
    threshold: number = 0.7
  ): ScoredCandidate | null {
    const scoredCandidates: ScoredCandidate[] = [];
    const failedId = failedElement.id || '';
    const failedClasses = failedElement.classes || [];
    const failedText = failedElement.text || '';
    const failedTag = failedElement.tag || '';

    for (const candidate of candidateElements) {
      let score = 0;
      const reasons: string[] = [];

      const candidateLocator = this.buildLocator(candidate);
      if (!candidateLocator) continue;

      if (failedId && candidate.id) {
        const idScore = this.calculateSimilarity(failedId, candidate.id);
        if (idScore > 0.5) {
          score += idScore * 0.4;
          reasons.push(`ID similarity: ${(idScore * 100).toFixed(1)}%`);
        }
      }

      if (failedClasses.length > 0 && candidate.classes && candidate.classes.length > 0) {
        const classScore = this.calculateClassSimilarity(failedClasses, candidate.classes);
        if (classScore > 0.5) {
          score += classScore * 0.3;
          reasons.push(`Class similarity: ${(classScore * 100).toFixed(1)}%`);
        }
      }

      if (failedText && candidate.text) {
        const textScore = this.calculateSimilarity(failedText, candidate.text);
        if (textScore > 0.5) {
          score += textScore * 0.2;
          reasons.push(`Text similarity: ${(textScore * 100).toFixed(1)}%`);
        }
      }

      if (failedTag && candidate.tag && failedTag === candidate.tag) {
        score += 0.1;
        reasons.push('Same tag');
      }

      if (score >= threshold) {
        scoredCandidates.push({
          locator: candidateLocator,
          score,
          reason: reasons.join(', ')
        });
      }
    }

    scoredCandidates.sort((a, b) => b.score - a.score);

    return scoredCandidates.length > 0 ? scoredCandidates[0] : null;
  }

  private calculateClassSimilarity(classes1: string[], classes2: string[]): number {
    if (classes1.length === 0 || classes2.length === 0) return 0;

    let totalScore = 0;
    let comparisons = 0;

    for (const c1 of classes1) {
      for (const c2 of classes2) {
        totalScore += this.calculateSimilarity(c1, c2);
        comparisons++;
      }
    }

    return comparisons > 0 ? totalScore / comparisons : 0;
  }

  private buildLocator(element: any): string | null {
    if (element.id) {
      return `#${element.id}`;
    }
    if (element.classes && element.classes.length > 0) {
      return `.${element.classes.join('.')}`;
    }
    if (element.text) {
      return `text=${element.text.substring(0, 50)}`;
    }
    if (element.attributes && element.attributes['data-testid']) {
      return `[data-testid="${element.attributes['data-testid']}"]`;
    }
    return null;
  }
}
