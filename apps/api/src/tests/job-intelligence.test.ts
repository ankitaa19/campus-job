import { cleanJobText, enrichJob, inferExperienceRequirements, inferIndustry, inferJobType } from '../services/job-intelligence';

describe('job intelligence evidence rules', () => {
  it('does not mistake an internship programme mentioned by a manager role for an internship', () => {
    expect(inferJobType(
      'Manager, Sales Development',
      'Own the strategy for our global SDR internship program.',
      'full-time'
    )).toBe('full-time');
  });

  it('uses a structured provider employment type ahead of incidental description words', () => {
    expect(inferJobType('Software Engineer', 'Mentor interns and temporary team members.', 'part-time')).toBe('part-time');
  });

  it('detects a role type from the title when structured data is absent', () => {
    expect(inferJobType('Seasonal Security Specialist', 'Protect the distribution centre.')).toBe('contract');
    expect(inferJobType('Software Engineering Intern', 'Build customer-facing features.')).toBe('internship');
  });

  it('does not convert a minimum age into years of experience', () => {
    expect(inferExperienceRequirements(
      'Security Specialist',
      'Must be at least 18 years of age. High school diploma required.'
    ).minExperience).toBe(0);
  });

  it('extracts explicitly stated experience', () => {
    expect(inferExperienceRequirements(
      'Technical Consultant',
      'Basic qualification: 4+ years of experience with reporting and SQL.'
    ).minExperience).toBe(4);
  });

  it('does not invent a broad industry from incidental job-description language', () => {
    expect(inferIndustry('Build financial reports for a government implementation.')).toBe('Not specified');
    expect(inferIndustry('Join our fintech payments platform team.')).toBe('FinTech');
  });

  it('decodes provider HTML entities and repairs suspicious age-derived experience', () => {
    expect(cleanJobText('You&#39;ll use SQL &amp; reporting.')).toBe("You'll use SQL & reporting.");
    const enriched = enrichJob({
      title: 'Security Specialist', description: 'Must be at least 18 years of age.',
      minExperience: 18, requiredSkills: [], requirements: [], locations: [], normalizationVersion: 2
    });
    expect(enriched.minExperience).toBe(0);
  });
});
