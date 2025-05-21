import { describe, it, expect, vi, beforeEach } from 'vitest';
import fs from 'fs';
import path from 'path';

// Since background.ts is not directly importable (it's a service worker),
// we'll create a testing version with the functions we want to test exposed

describe('Background script domain matching', () => {
  // Extract the domain matching function from the background script
  let isDomainMatch: (domain: string, trackedSite: string) => boolean;
  
  beforeEach(() => {
    // Reset the mocks
    vi.resetAllMocks();
    
    // Read the background.ts file as a string
    const backgroundPath = path.resolve(__dirname, '../background.ts');
    const backgroundContent = fs.readFileSync(backgroundPath, 'utf8');
    
    // Find and extract the isDomainMatch function
    const functionMatch = backgroundContent.match(/function isDomainMatch\([^)]+\)[^{]+{([\s\S]+?)}/) || [];
    const functionBody = functionMatch[1] || '';
    
    // Create a function from the extracted code
    isDomainMatch = new Function('domain', 'trackedSite', `
      ${functionBody}
      return domainLower === siteLower || 
             domainLower === \`www.\${siteLower}\` || 
             domainLower.endsWith(\`.\${siteLower}\`);
    `) as any;
  });

  it('matches exact domains', () => {
    expect(isDomainMatch('example.com', 'example.com')).toBe(true);
  });

  it('is case insensitive', () => {
    expect(isDomainMatch('ExAmPlE.CoM', 'example.com')).toBe(true);
  });

  it('matches www subdomain', () => {
    expect(isDomainMatch('www.example.com', 'example.com')).toBe(true);
  });

  it('matches other subdomains', () => {
    expect(isDomainMatch('blog.example.com', 'example.com')).toBe(true);
    expect(isDomainMatch('api.example.com', 'example.com')).toBe(true);
  });

  it('does not match different domains', () => {
    expect(isDomainMatch('example.org', 'example.com')).toBe(false);
    expect(isDomainMatch('examplesite.com', 'example.com')).toBe(false);
  });
});