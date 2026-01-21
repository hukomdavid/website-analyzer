// api/analyze.js - Vercel Serverless Function
// This file should be placed in /api/analyze.js in your project

const https = require('https');
const http = require('http');

module.exports = async (req, res) => {
  // Enable CORS
  res.setHeader('Access-Control-Allow-Origin', '*');
  res.setHeader('Access-Control-Allow-Methods', 'POST, OPTIONS');
  res.setHeader('Access-Control-Allow-Headers', 'Content-Type');

  if (req.method === 'OPTIONS') {
    return res.status(200).end();
  }

  if (req.method !== 'POST') {
    return res.status(405).json({ error: 'Method not allowed' });
  }

  const { url } = req.body;

  if (!url) {
    return res.status(400).json({ error: 'URL is required' });
  }

  try {
    // Fetch website HTML
    const html = await fetchWebsite(url);
    
    // Perform real analysis
    const analysis = analyzeWebsite(html, url);
    
    return res.status(200).json(analysis);
  } catch (error) {
    console.error('Analysis error:', error);
    return res.status(500).json({ error: 'Failed to analyze website' });
  }
};

// Fetch website content
function fetchWebsite(url) {
  return new Promise((resolve, reject) => {
    const protocol = url.startsWith('https') ? https : http;
    
    protocol.get(url, {
      headers: {
        'User-Agent': 'Mozilla/5.0 (compatible; WebsiteAnalyzer/1.0)'
      }
    }, (response) => {
      let data = '';
      
      response.on('data', chunk => {
        data += chunk;
      });
      
      response.on('end', () => {
        resolve(data);
      });
    }).on('error', reject);
  });
}

// Main analysis function
function analyzeWebsite(html, url) {
  const uiuxAnalysis = analyzeUIUX(html);
  const wcagAnalysis = analyzeWCAG(html);
  const perfAnalysis = analyzePerformance(html, url);
  const seoAnalysis = analyzeSEO(html);

  const overallScore = Math.floor(
    (uiuxAnalysis.score + wcagAnalysis.score + perfAnalysis.score + seoAnalysis.score) / 4
  );

  return {
    url,
    overallScore,
    categories: {
      uiux: uiuxAnalysis,
      wcag: wcagAnalysis,
      performance: perfAnalysis,
      seo: seoAnalysis
    }
  };
}

// UI/UX Analysis
function analyzeUIUX(html) {
  const issues = [];
  const recommendations = [];
  let score = 100;

  // Check for buttons
  const buttonMatches = html.match(/<button[^>]*>/gi) || [];
  const linkButtons = html.match(/<a[^>]*class="[^"]*btn[^"]*"[^>]*>/gi) || [];
  const totalButtons = buttonMatches.length + linkButtons.length;

  if (totalButtons > 10) {
    issues.push({
      severity: 'medium',
      text: `Found ${totalButtons} interactive buttons/links - consider reducing to improve clarity (Hick's Law)`
    });
    score -= 10;
  }

  // Check heading structure
  const h1Count = (html.match(/<h1[^>]*>/gi) || []).length;
  if (h1Count === 0) {
    issues.push({
      severity: 'high',
      text: 'No H1 heading found - main page title missing affects visual hierarchy'
    });
    score -= 15;
  }

  // Check for navigation
  const hasNav = html.includes('<nav') || html.includes('navigation');
  if (!hasNav) {
    issues.push({
      severity: 'medium',
      text: 'No semantic <nav> element detected - navigation structure unclear'
    });
    score -= 10;
  }

  // Check for forms without labels
  const forms = html.match(/<form[^>]*>[\s\S]*?<\/form>/gi) || [];
  forms.forEach((form, idx) => {
    const inputs = form.match(/<input[^>]*>/gi) || [];
    const labels = form.match(/<label[^>]*>/gi) || [];
    if (inputs.length > labels.length) {
      issues.push({
        severity: 'medium',
        text: `Form #${idx + 1} has ${inputs.length - labels.length} input(s) without associated labels`
      });
      score -= 8;
    }
  });

  recommendations.push('Ensure primary CTAs use contrasting colors and adequate size (min 44x44px)');
  recommendations.push('Maintain consistent spacing using 8px grid system');
  recommendations.push('Group related navigation items to reduce cognitive load');

  const checklist = [
    'Review all interactive elements for adequate size (minimum 44x44px touch targets)',
    'Standardize spacing between sections using consistent values',
    'Ensure visual hierarchy: most important elements should stand out first',
    'Limit navigation items to 7±2 choices per menu level'
  ];

  return {
    score: Math.max(0, score),
    summary: totalButtons > 15 
      ? "Your interface has many interactive elements. Simplifying choices and grouping related actions can help users navigate more intuitively and reduce decision fatigue."
      : "Your design structure shows good organization! Fine-tuning spacing and visual hierarchy will help guide users naturally through the content.",
    issues,
    recommendations,
    checklist
  };
}

// WCAG Accessibility Analysis
function analyzeWCAG(html) {
  const issues = [];
  const recommendations = [];
  let score = 100;

  // Check images without alt text
  const imgTags = html.match(/<img[^>]*>/gi) || [];
  const imagesWithoutAlt = imgTags.filter(img => !img.includes('alt='));
  
  if (imagesWithoutAlt.length > 0) {
    const examples = imagesWithoutAlt.slice(0, 3).map(img => {
      const srcMatch = img.match(/src=["']([^"']+)["']/);
      const src = srcMatch ? srcMatch[1].split('/').pop() : 'unknown';
      return src;
    });
    
    issues.push({
      severity: 'high',
      text: `${imagesWithoutAlt.length} image(s) missing alt text. Examples: ${examples.join(', ')}`
    });
    score -= Math.min(30, imagesWithoutAlt.length * 5);
    
    recommendations.push('Add descriptive alt text to all images, especially: ' + examples.join(', '));
  }

  // Check for aria-labels
  const interactiveElements = (html.match(/<button[^>]*>|<a[^>]*>/gi) || []).length;
  const ariaLabels = (html.match(/aria-label=/gi) || []).length;
  
  if (interactiveElements > 5 && ariaLabels === 0) {
    issues.push({
      severity: 'medium',
      text: 'No ARIA labels found - screen readers may have difficulty identifying interactive elements'
    });
    score -= 12;
  }

  // Check heading hierarchy
  const h1s = (html.match(/<h1[^>]*>/gi) || []).length;
  const h2s = (html.match(/<h2[^>]*>/gi) || []).length;
  const h3s = (html.match(/<h3[^>]*>/gi) || []).length;

  if (h1s > 1) {
    issues.push({
      severity: 'high',
      text: `Multiple H1 tags found (${h1s}) - should only have one per page for proper document structure`
    });
    score -= 15;
  }

  if (h2s === 0 && h3s > 0) {
    issues.push({
      severity: 'medium',
      text: 'H3 tags used without H2 tags - heading hierarchy is broken'
    });
    score -= 10;
  }

  // Check for form labels
  const inputs = (html.match(/<input[^>]*>/gi) || []).length;
  const labels = (html.match(/<label[^>]*>/gi) || []).length;
  
  if (inputs > labels + 1) {
    issues.push({
      severity: 'medium',
      text: `${inputs - labels} form input(s) appear to be missing associated labels`
    });
    score -= 10;
  }

  recommendations.push('Ensure all interactive elements have proper ARIA labels or visible text');
  recommendations.push('Test full keyboard navigation (Tab, Enter, Escape keys)');
  recommendations.push('Add skip-to-main-content link for keyboard users');

  const checklist = [
    'Add meaningful alt text to all images (be descriptive, not just keywords)',
    'Ensure color contrast meets WCAG AA standards (4.5:1 for normal text)',
    'Test complete site navigation using only keyboard',
    'Associate all form inputs with proper labels',
    'Add focus indicators to all interactive elements'
  ];

  return {
    score: Math.max(0, score),
    summary: imagesWithoutAlt.length > 5
      ? "Several images are missing descriptions, which means screen reader users won't know what they show. Adding alt text is straightforward and opens your site to millions more visitors."
      : "Your accessibility foundation is decent! A few tweaks to labels and keyboard navigation will make the experience seamless for everyone.",
    issues,
    recommendations,
    checklist
  };
}

// Performance Analysis
function analyzePerformance(html, url) {
  const issues = [];
  const recommendations = [];
  let score = 100;

  // Check HTML size
  const htmlSize = Buffer.byteLength(html, 'utf8');
  const htmlSizeMB = (htmlSize / 1024 / 1024).toFixed(2);

  if (htmlSize > 500000) {
    issues.push({
      severity: 'high',
      text: `Large HTML document (${htmlSizeMB}MB) - consider code splitting and lazy loading`
    });
    score -= 20;
  }

  // Check for inline styles
  const inlineStyles = (html.match(/style=/gi) || []).length;
  if (inlineStyles > 20) {
    issues.push({
      severity: 'medium',
      text: `${inlineStyles} inline style attributes found - extract to external CSS for better caching`
    });
    score -= 12;
  }

  // Check external resources
  const scripts = (html.match(/<script[^>]*src=/gi) || []).length;
  const stylesheets = (html.match(/<link[^>]*rel=["']stylesheet["']/gi) || []).length;
  const totalExternal = scripts + stylesheets;

  if (totalExternal > 15) {
    issues.push({
      severity: 'medium',
      text: `${totalExternal} external resources (${scripts} scripts, ${stylesheets} stylesheets) - consider bundling`
    });
    score -= 10;
  }

  // Check for render-blocking resources
  const blockingScripts = html.match(/<script(?![^>]*async)(?![^>]*defer)[^>]*src=/gi) || [];
  if (blockingScripts.length > 0) {
    issues.push({
      severity: 'medium',
      text: `${blockingScripts.length} render-blocking script(s) detected - add async or defer attributes`
    });
    score -= 15;
  }

  // Check images
  const images = (html.match(/<img[^>]*>/gi) || []).length;
  if (images > 20) {
    issues.push({
      severity: 'medium',
      text: `${images} images found - implement lazy loading for images below the fold`
    });
    score -= 8;
  }

  recommendations.push('Compress and convert images to modern formats (WebP, AVIF)');
  recommendations.push('Add async/defer to non-critical JavaScript files');
  recommendations.push('Implement browser caching headers for static assets');
  recommendations.push('Minify CSS and JavaScript files');

  const checklist = [
    'Compress all images and use modern formats (WebP, AVIF)',
    'Implement lazy loading for images below the fold',
    'Add async or defer attributes to non-critical scripts',
    'Minify all CSS and JavaScript files',
    'Enable browser caching with proper cache-control headers',
    'Use CDN for static assets if possible'
  ];

  return {
    score: Math.max(0, score),
    summary: totalExternal > 20
      ? "Your site loads quite a few external resources. Combining files and deferring non-critical scripts will make everything feel much snappier, especially on slower connections."
      : "Performance looks reasonable! Some quick optimizations to images and scripts could still shave off valuable milliseconds.",
    issues,
    recommendations,
    checklist
  };
}

// SEO Analysis
function analyzeSEO(html) {
  const issues = [];
  const recommendations = [];
  let score = 100;

  // Check title tag
  const titleMatch = html.match(/<title[^>]*>([^<]+)<\/title>/i);
  if (!titleMatch) {
    issues.push({
      severity: 'high',
      text: 'Missing <title> tag - critical for search engine rankings'
    });
    score -= 20;
  } else {
    const title = titleMatch[1];
    if (title.length < 30) {
      issues.push({
        severity: 'medium',
        text: `Page title too short (${title.length} characters: "${title}") - aim for 50-60 characters`
      });
      score -= 10;
    } else if (title.length > 60) {
      issues.push({
        severity: 'low',
        text: `Page title too long (${title.length} characters) - may be truncated in search results`
      });
      score -= 5;
    }
  }

  // Check meta description
  const metaDescMatch = html.match(/<meta[^>]*name=["']description["'][^>]*content=["']([^"']+)["']/i);
  if (!metaDescMatch) {
    issues.push({
      severity: 'high',
      text: 'Missing meta description - search engines will generate their own snippet'
    });
    score -= 20;
    recommendations.push('Add compelling meta description (150-160 characters) to improve click-through rates');
  } else {
    const desc = metaDescMatch[1];
    if (desc.length < 120) {
      issues.push({
        severity: 'medium',
        text: `Meta description too short (${desc.length} characters) - aim for 150-160 characters`
      });
      score -= 8;
    }
  }

  // Check H1 tags
  const h1Count = (html.match(/<h1[^>]*>/gi) || []).length;
  if (h1Count === 0) {
    issues.push({
      severity: 'high',
      text: 'No H1 tag found - missing primary page heading for SEO'
    });
    score -= 15;
  } else if (h1Count > 1) {
    issues.push({
      severity: 'medium',
      text: `Multiple H1 tags (${h1Count}) detected - should have exactly one per page`
    });
    score -= 10;
  }

  // Check heading hierarchy
  const h2Count = (html.match(/<h2[^>]*>/gi) || []).length;
  const h3Count = (html.match(/<h3[^>]*>/gi) || []).length;
  
  if (h2Count === 0 && h3Count > 0) {
    issues.push({
      severity: 'low',
      text: 'Heading hierarchy broken - H3 used without H2 tags'
    });
    score -= 5;
  }

  // Check for structured data
  const hasStructuredData = html.includes('application/ld+json') || html.includes('schema.org');
  if (!hasStructuredData) {
    issues.push({
      severity: 'low',
      text: 'No structured data (Schema.org) detected - missing rich snippets opportunity'
    });
    score -= 8;
  }

  // Check canonical URL
  const hasCanonical = html.includes('rel="canonical"');
  if (!hasCanonical) {
    issues.push({
      severity: 'low',
      text: 'No canonical URL specified - could lead to duplicate content issues'
    });
    score -= 5;
  }

  recommendations.push('Ensure each page has unique, descriptive title and meta description');
  recommendations.push('Create proper heading hierarchy (single H1, then H2, H3, etc.)');
  recommendations.push('Implement Schema.org structured data for better search appearance');

  const checklist = [
    'Write unique title tag (50-60 characters) for each page',
    'Add compelling meta description (150-160 characters) for each page',
    'Ensure exactly one H1 tag per page with primary keyword',
    'Create logical heading hierarchy (H1 → H2 → H3)',
    'Add Schema.org structured data markup',
    'Verify all images have descriptive alt text'
  ];

  return {
    score: Math.max(0, score),
    summary: !metaDescMatch
      ? "Search engines need help understanding your content. Adding proper titles and descriptions tells them exactly what each page is about, helping the right people discover you."
      : "Your SEO basics are in place! Adding structured data and fine-tuning your content structure will give you an extra edge in search results.",
    issues,
    recommendations,
    checklist
  };
}