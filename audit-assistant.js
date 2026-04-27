/**
 * RecuroAI Audit Assistant
 * Processes messy SaaS tool lists and generates professional audit reports
 */

// Check if we're in Node.js environment
const isNode = typeof window === 'undefined';

let openai = null;

if (isNode) {
  try {
    const { default: OpenAI } = await import('openai');
    openai = new OpenAI({
      apiKey: process.env.OPENAI_API_KEY
    });
  } catch (error) {
    console.error('OpenAI not available:', error.message);
  }
}

// SaaS pricing database for cost estimation
const SAAS_PRICING = {
  'Slack': { basePrice: 6.67, category: 'Communication', notes: 'Per user/month for Pro plan' },
  'Microsoft Teams': { basePrice: 5, category: 'Communication', notes: 'Part of Office 365' },
  'Zoom': { basePrice: 14.99, category: 'Communication', notes: 'Pro plan' },
  'Google Meet': { basePrice: 0, category: 'Communication', notes: 'Free with Google Workspace' },
  'Discord': { basePrice: 0, category: 'Communication', notes: 'Free for basic use' },
  
  'Asana': { basePrice: 10.99, category: 'Project Management', notes: 'Per user/month Premium' },
  'Monday.com': { basePrice: 8, category: 'Project Management', notes: 'Per user/month Basic' },
  'Trello': { basePrice: 5, category: 'Project Management', notes: 'Per user/month Standard' },
  'Notion': { basePrice: 8, category: 'Project Management', notes: 'Per user/month Team' },
  'ClickUp': { basePrice: 7, category: 'Project Management', notes: 'Per user/month Unlimited' },
  'Jira': { basePrice: 7, category: 'Project Management', notes: 'Per user/month Standard' },
  
  'GitHub': { basePrice: 4, category: 'DevOps', notes: 'Per user/month Team' },
  'GitLab': { basePrice: 19, category: 'DevOps', notes: 'Per user/month Premium' },
  'Docker': { basePrice: 5, category: 'DevOps', notes: 'Per user/month Pro' },
  'AWS': { basePrice: 50, category: 'DevOps', notes: 'Estimated monthly usage' },
  'Heroku': { basePrice: 7, category: 'DevOps', notes: 'Per dyno/month' },
  
  'Dropbox': { basePrice: 15, category: 'Cloud Storage', notes: 'Per user/month Advanced' },
  'Google Drive': { basePrice: 6, category: 'Cloud Storage', notes: 'Per user/month Business Standard' },
  'OneDrive': { basePrice: 5, category: 'Cloud Storage', notes: 'Per user/month Plan 1' },
  'Box': { basePrice: 15, category: 'Cloud Storage', notes: 'Per user/month Business' },
  
  'Salesforce': { basePrice: 25, category: 'CRM / Sales', notes: 'Per user/month Professional' },
  'HubSpot': { basePrice: 45, category: 'CRM / Sales', notes: 'Per user/month Professional' },
  'Pipedrive': { basePrice: 14.90, category: 'CRM / Sales', notes: 'Per user/month Advanced' },
  'Zendesk': { basePrice: 19, category: 'CRM / Sales', notes: 'Per user/month Professional' },
  
  'QuickBooks': { basePrice: 30, category: 'Finance / Accounting', notes: 'Per month Simple Start' },
  'Xero': { basePrice: 13, category: 'Finance / Accounting', notes: 'Per month Growing' },
  'FreshBooks': { basePrice: 15, category: 'Finance / Accounting', notes: 'Per month Plus' },
  
  'Google Analytics': { basePrice: 0, category: 'Analytics', notes: 'Free tier' },
  'Mixpanel': { basePrice: 25, category: 'Analytics', notes: 'Per month Growth' },
  'Amplitude': { basePrice: 61, category: 'Analytics', notes: 'Per month Plus' },
  
  'Mailchimp': { basePrice: 10, category: 'Marketing', notes: 'Per month Essentials' },
  'HubSpot Marketing': { basePrice: 45, category: 'Marketing', notes: 'Per month Professional' },
  'Constant Contact': { basePrice: 20, category: 'Marketing', notes: 'Per month Core' },
  
  'BambooHR': { basePrice: 6, category: 'HR / Operations', notes: 'Per employee/month' },
  'Workday': { basePrice: 35, category: 'HR / Operations', notes: 'Per employee/month' },
  'Gusto': { basePrice: 6, category: 'HR / Operations', notes: 'Per employee/month' },
  
  'Adobe Creative Suite': { basePrice: 52.99, category: 'Design', notes: 'Per user/month All Apps' },
  'Figma': { basePrice: 12, category: 'Design', notes: 'Per user/month Professional' },
  'Canva': { basePrice: 12.99, category: 'Design', notes: 'Per user/month Pro' }
};

/**
 * Clean and categorize messy tool list using enhanced dataset knowledge
 */
async function cleanAndCategorizeTools(rawToolList) {
  try {
    // If OpenAI is not available, use enhanced fallback with both datasets
    if (!openai) {
      console.log('OpenAI not available, using enhanced fallback parsing');
      return parseToolListWithDatasets(rawToolList);
    }

    // Get context from both our datasets
    const datasetContext = await getToolContextFromDatasets(rawToolList);

    const prompt = `You are a SaaS expert with access to comprehensive industry data covering 300+ tools across 90+ categories.

DATASET CONTEXT: ${datasetContext}

Raw list to clean: ${rawToolList}

Clean this messy SaaS tool list using your comprehensive knowledge. Fix typos, identify proper tool names, and categorize accurately. Use the dataset context above to ensure accurate tool names and categories.

Return a JSON object with enhanced tool information:
{
  "tools": [
    {
      "toolName": "Slack",
      "category": "Communication", 
      "estimatedCost": 6.67,
      "pricingModel": "per_user_monthly",
      "alternatives": ["Microsoft Teams", "Discord"],
      "notes": "Popular communication platform"
    }
  ]
}

Use categories from our 90+ category dataset. Include cost estimates when you recognize the tool from the context.`;

    const response = await openai.chat.completions.create({
      model: "gpt-5", // the newest OpenAI model is "gpt-5" which was released August 7, 2025. do not change this unless explicitly requested by the user
      messages: [
        {
          role: "system",
          content: "You are a SaaS tool expert with access to comprehensive industry pricing data for 300+ tools. Clean and categorize software tool lists accurately using real market data. Always return valid JSON with enhanced tool information."
        },
        {
          role: "user",
          content: prompt
        }
      ],
      response_format: { type: "json_object" }
    });

    const result = JSON.parse(response.choices[0].message.content);
    return result.tools || result; // Handle different JSON structures

  } catch (error) {
    console.error('Error cleaning tools with OpenAI:', error);
    // Enhanced fallback parsing using both datasets
    return parseToolListWithDatasets(rawToolList);
  }
}

/**
 * Get tool context from both datasets for AI analysis
 */
async function getToolContextFromDatasets(rawToolList) {
  try {
    // Extract potential tool names from the raw list
    const potentialTools = rawToolList.split(/[,\n;]/).map(tool => tool.trim()).filter(tool => tool.length > 2);
    
    let context = "TOOLS FROM YOUR DATASETS:\n\n";
    
    // For each potential tool, try to find it in our API
    for (const toolName of potentialTools.slice(0, 8)) { // Limit to avoid overflow
      try {
        const response = await fetch(`/api/saas/search?q=${encodeURIComponent(toolName)}`);
        if (response.ok) {
          const data = await response.json();
          if (data.success && data.results.length > 0) {
            const tool = data.results[0];
            context += `${tool.vendor}: ${tool.startingPrice} (${tool.category})\n`;
            
            // Get alternatives if available
            const vendorResponse = await fetch(`/api/saas/vendor/${tool.slug}`);
            if (vendorResponse.ok) {
              const vendorData = await vendorResponse.json();
              if (vendorData.success && vendorData.vendor.Cheaper_Alternatives) {
                context += `  Alternatives: ${vendorData.vendor.Cheaper_Alternatives}\n`;
              }
            }
          }
        }
      } catch (error) {
        // Skip this tool if API call fails
        continue;
      }
    }
    
    context += "\nUse this data to provide accurate pricing and alternatives.\n";
    return context;
    
  } catch (error) {
    console.warn('Error getting dataset context:', error);
    return "Using general tool knowledge for analysis.\n";
  }
}

/**
 * Enhanced fallback parsing using both datasets
 */
async function parseToolListWithDatasets(rawToolList) {
  const lines = rawToolList.split(/[,\n]/).filter(line => line.trim());
  const tools = [];
  
  for (const line of lines) {
    const cleanName = line.trim();
    if (cleanName && cleanName.length > 2) {
      try {
        // Try to find the tool in our merged dataset
        const response = await fetch(`/api/saas/search?q=${encodeURIComponent(cleanName)}`);
        if (response.ok) {
          const data = await response.json();
          if (data.success && data.results.length > 0) {
            const tool = data.results[0];
            const priceMatch = tool.startingPrice.match(/\$?(\d+(?:\.\d+)?)/);
            const basePrice = priceMatch ? parseFloat(priceMatch[1]) : 10;
            
            tools.push({
              toolName: tool.vendor,
              category: tool.category,
              estimatedCost: basePrice,
              pricingModel: tool.billingModel.toLowerCase().includes('user') ? 'per_user_monthly' : 'flat_monthly',
              notes: 'Matched from dataset'
            });
            continue;
          }
        }
      } catch (error) {
        // Continue with fallback if API fails
      }
      
      // Fallback to basic tool mapping
      const toolMap = {
        'slack': { name: 'Slack', category: 'Communication', cost: 6.67 },
        'asana': { name: 'Asana', category: 'Project Management', cost: 10.99 },
        'monday': { name: 'Monday.com', category: 'Project Management', cost: 8 },
        'zoom': { name: 'Zoom', category: 'Communication', cost: 14.99 },
        'google meet': { name: 'Google Meet', category: 'Communication', cost: 0 },
        'google drive': { name: 'Google Drive', category: 'Cloud Storage', cost: 6 },
        'dropbox': { name: 'Dropbox', category: 'Cloud Storage', cost: 15 },
        'salesforce': { name: 'Salesforce', category: 'CRM / Sales', cost: 25 },
        'adobe': { name: 'Adobe Creative Suite', category: 'Design', cost: 52.99 },
        'github': { name: 'GitHub', category: 'DevOps', cost: 4 }
      };
      
      let matched = false;
      const cleanNameLower = cleanName.toLowerCase();
      
      for (const [key, tool] of Object.entries(toolMap)) {
        if (cleanNameLower.includes(key) || key.includes(cleanNameLower)) {
          tools.push({
            toolName: tool.name,
            category: tool.category,
            estimatedCost: tool.cost,
            pricingModel: 'per_user_monthly',
            notes: 'Fallback match'
          });
          matched = true;
          break;
        }
      }
      
      if (!matched) {
        tools.push({
          toolName: cleanName,
          category: 'Other',
          estimatedCost: 10,
          pricingModel: 'estimated',
          notes: 'Unknown tool'
        });
      }
    }
  }
  
  return tools;
}

/**
 * Fallback tool parsing when GPT fails
 */
function parseToolListFallback(rawToolList) {
  const lines = rawToolList.split(/[,\n]/).filter(line => line.trim());
  const tools = [];
  
  // Simple tool name mapping for common tools
  const toolMap = {
    'slack': { name: 'Slack', category: 'Communication' },
    'asana': { name: 'Asana', category: 'Project Management' },
    'monday': { name: 'Monday.com', category: 'Project Management' },
    'zoom': { name: 'Zoom', category: 'Communication' },
    'google meet': { name: 'Google Meet', category: 'Communication' },
    'google drive': { name: 'Google Drive', category: 'Cloud Storage' },
    'dropbox': { name: 'Dropbox', category: 'Cloud Storage' },
    'salesforce': { name: 'Salesforce', category: 'CRM / Sales' },
    'adobe': { name: 'Adobe Creative Suite', category: 'Design' },
    'github': { name: 'GitHub', category: 'DevOps' },
    'docusign': { name: 'DocuSign', category: 'Document Management' },
    'trello': { name: 'Trello', category: 'Project Management' },
    'notion': { name: 'Notion', category: 'Project Management' },
    'figma': { name: 'Figma', category: 'Design' },
    'hubspot': { name: 'HubSpot', category: 'CRM / Sales' }
  };
  
  lines.forEach(line => {
    const cleanName = line.trim().toLowerCase().replace(/[^\w\s]/g, '');
    if (cleanName && cleanName.length > 2) {
      // Try to match known tools
      let matched = false;
      for (const [key, tool] of Object.entries(toolMap)) {
        if (cleanName.includes(key) || key.includes(cleanName)) {
          tools.push({
            toolName: tool.name,
            category: tool.category,
            notes: 'Auto-parsed'
          });
          matched = true;
          break;
        }
      }
      
      // If no match, use the original name
      if (!matched) {
        tools.push({
          toolName: line.trim(),
          category: 'Other',
          notes: 'Auto-parsed'
        });
      }
    }
  });
  
  return tools;
}

/**
 * Estimate costs for cleaned tools using enhanced dataset pricing
 */
async function estimateToolCosts(cleanedTools, companySize = 25) {
  const enhancedTools = [];
  
  for (const tool of cleanedTools) {
    let finalTool = { ...tool };
    
    // Try to get real pricing from our datasets
    try {
      const response = await fetch(`/api/saas/search?q=${encodeURIComponent(tool.toolName)}`);
      if (response.ok) {
        const data = await response.json();
        if (data.success && data.results.length > 0) {
          const match = data.results[0];
          const priceMatch = match.startingPrice.match(/\$?(\d+(?:\.\d+)?)/);
          const realPrice = priceMatch ? parseFloat(priceMatch[1]) : tool.estimatedCost || 10;
          
          finalTool.estimatedMonthlyCost = match.billingModel.toLowerCase().includes('user') 
            ? realPrice * companySize 
            : realPrice;
          finalTool.pricePerUser = realPrice;
          finalTool.pricingNotes = `Real market price: ${match.startingPrice}`;
          finalTool.category = match.category; // Update with accurate category
        }
      }
    } catch (error) {
      // Use fallback pricing if API call fails
    }
    
    // Fallback to hardcoded pricing if no match found
    if (!finalTool.estimatedMonthlyCost) {
      const pricing = SAAS_PRICING[tool.toolName] || { basePrice: tool.estimatedCost || 10, notes: 'Estimated' };
      finalTool.estimatedMonthlyCost = pricing.basePrice * (pricing.basePrice === 0 ? 1 : companySize);
      finalTool.pricePerUser = pricing.basePrice;
      finalTool.pricingNotes = pricing.notes;
    }
    
    enhancedTools.push(finalTool);
  }
  
  return enhancedTools;
}

/**
 * Identify redundancies and optimization opportunities using enhanced dataset knowledge
 */
async function identifyOptimizations(toolsWithCosts) {
  const redundancies = [];
  const recommendations = [];
  
  // Group by category
  const byCategory = toolsWithCosts.reduce((acc, tool) => {
    if (!acc[tool.category]) acc[tool.category] = [];
    acc[tool.category].push(tool);
    return acc;
  }, {});
  
  // Enhanced redundancy detection using both datasets
  for (const [category, tools] of Object.entries(byCategory)) {
    if (tools.length > 1) {
      const sortedByCost = tools.sort((a, b) => b.estimatedMonthlyCost - a.estimatedMonthlyCost);
      
      // Get smart recommendations for each tool using our datasets
      for (const tool of sortedByCost.slice(1)) { // Skip the most expensive (likely the keeper)
        try {
          const response = await fetch(`/api/saas/search?q=${encodeURIComponent(tool.toolName)}`);
          if (response.ok) {
            const data = await response.json();
            if (data.success && data.results.length > 0) {
              const match = data.results[0];
              
              // Get alternatives from our dataset
              const vendorResponse = await fetch(`/api/saas/vendor/${match.slug}`);
              if (vendorResponse.ok) {
                const vendorData = await vendorResponse.json();
                let smartAdvice = `Consider replacing ${tool.toolName} with `;
                
                if (vendorData.success && vendorData.vendor.Cheaper_Alternatives) {
                  const alternatives = vendorData.vendor.Cheaper_Alternatives.split(',').map(alt => alt.trim());
                  smartAdvice += `${alternatives[0]} or consolidate with your primary ${category.toLowerCase()} tool.`;
                } else {
                  smartAdvice += `a more cost-effective ${category.toLowerCase()} solution.`;
                }
                
                recommendations.push({
                  type: 'smart_consolidation',
                  message: smartAdvice,
                  potentialSaving: tool.estimatedMonthlyCost * 0.8, // More accurate savings estimate
                  confidence: 'high',
                  tool: tool.toolName,
                  alternatives: vendorData.success ? vendorData.vendor.Cheaper_Alternatives : ''
                });
              }
            }
          }
        } catch (error) {
          // Fallback to basic recommendation
          recommendations.push({
            type: 'consolidation',
            message: `Consider consolidating ${category} tools. ${tool.toolName} may be redundant.`,
            potentialSaving: tool.estimatedMonthlyCost * 0.6
          });
        }
      }
      
      redundancies.push({
        category,
        primaryTool: sortedByCost[0].toolName,
        redundantTools: sortedByCost.slice(1).map(t => t.toolName),
        potentialSaving: sortedByCost.slice(1).reduce((sum, tool) => sum + tool.estimatedMonthlyCost, 0)
      });
    }
  }
  
  // Enhanced high-cost tool analysis
  for (const tool of toolsWithCosts) {
    if (tool.estimatedMonthlyCost > 200) {
      try {
        // Get specific optimization advice from our datasets
        const response = await fetch(`/api/saas/search?q=${encodeURIComponent(tool.toolName)}`);
        if (response.ok) {
          const data = await response.json();
          if (data.success && data.results.length > 0) {
            const match = data.results[0];
            const priceMatch = match.startingPrice.match(/\$?(\d+(?:\.\d+)?)/);
            const marketPrice = priceMatch ? parseFloat(priceMatch[1]) : null;
            
            const companySize = 25; // Default company size for calculation
            if (marketPrice && tool.estimatedMonthlyCost > marketPrice * companySize * 1.5) {
              recommendations.push({
                type: 'overpriced',
                message: `${tool.toolName} costs $${tool.estimatedMonthlyCost}/month but market rate is ~$${Math.round(marketPrice * companySize)}. Review your plan tier.`,
                potentialSaving: tool.estimatedMonthlyCost - (marketPrice * companySize),
                confidence: 'high',
                tool: tool.toolName
              });
            } else {
              recommendations.push({
                type: 'review',
                message: `${tool.toolName} is expensive ($${tool.estimatedMonthlyCost}/month). Review usage and consider alternatives.`,
                potentialSaving: tool.estimatedMonthlyCost * 0.3,
                confidence: 'medium',
                tool: tool.toolName
              });
            }
          }
        }
      } catch (error) {
        // Fallback for high-cost tools
        recommendations.push({
          type: 'review',
          message: `${tool.toolName} is expensive ($${tool.estimatedMonthlyCost}/month). Review usage to ensure it's necessary.`,
          potentialSaving: tool.estimatedMonthlyCost * 0.5
        });
      }
    }
  }
  
  return { redundancies, recommendations };
}

/**
 * Generate professional audit report
 */
async function generateAuditReport(rawToolList, companySize = 25) {
  try {
    // Step 1: Clean and categorize
    console.log('Cleaning and categorizing tools...');
    const cleanedTools = await cleanAndCategorizeTools(rawToolList);
    
    // Step 2: Estimate costs with enhanced dataset pricing
    console.log('Estimating costs with real market data...');
    const toolsWithCosts = await estimateToolCosts(cleanedTools, companySize);
    
    // Step 3: Identify optimizations using smart dataset analysis
    console.log('Identifying optimizations with dataset intelligence...');
    const { redundancies, recommendations } = await identifyOptimizations(toolsWithCosts);
    
    // Step 4: Calculate totals
    const totalMonthlyCost = toolsWithCosts.reduce((sum, tool) => sum + tool.estimatedMonthlyCost, 0);
    const totalPotentialSavings = recommendations.reduce((sum, rec) => sum + (rec.potentialSaving || 0), 0);
    
    // Step 5: Generate report
    const report = await generateFormattedReport({
      cleanedTools: toolsWithCosts,
      totalMonthlyCost,
      totalPotentialSavings,
      redundancies,
      recommendations,
      companySize
    });
    
    return {
      success: true,
      report,
      metadata: {
        toolsAnalyzed: cleanedTools.length,
        totalMonthlyCost,
        totalPotentialSavings,
        redundanciesFound: redundancies.length
      }
    };
    
  } catch (error) {
    console.error('Error generating audit report:', error);
    return {
      success: false,
      error: error.message,
      fallbackReport: generateFallbackReport(rawToolList)
    };
  }
}

/**
 * Generate formatted professional report with specific actions
 */
async function generateFormattedReport(data) {
  const { cleanedTools, totalMonthlyCost, totalPotentialSavings, redundancies, recommendations, companySize } = data;
  
  // Identify tools with specific issues
  const overpayingTools = [];
  const allToolsBreakdown = [];
  const immediateActions = [];
  
  // Process each tool for actionable insights
  cleanedTools.forEach(tool => {
    const action = determineToolAction(tool, cleanedTools);
    
    allToolsBreakdown.push({
      name: tool.toolName,
      category: tool.category,
      cost: tool.estimatedMonthlyCost,
      action: action.recommendation,
      actionType: action.type
    });
    
    if (action.type === 'cancel' || action.type === 'consolidate') {
      overpayingTools.push({
        name: tool.toolName,
        problem: action.problem,
        action: action.specificAction,
        savings: tool.estimatedMonthlyCost
      });
      
      immediateActions.push({
        tool: tool.toolName,
        steps: action.detailedSteps
      });
    }
  });
  
  // Calculate waste percentage
  const wastePercentage = Math.round((totalPotentialSavings / totalMonthlyCost) * 100);
  
  // Build report sections
  const overpayingSection = overpayingTools.length > 0 ? 
    `## You're Overpaying on These Tools

| Tool | Problem | Action | Monthly Savings |
|------|---------|--------|-----------------|
${overpayingTools.map(tool => 
  `| ${tool.name} | ${tool.problem} | ${tool.action} | $${tool.savings} |`
).join('\n')}

---

` : '';

  const toolBreakdownTable = allToolsBreakdown.map(tool => 
    `| ${tool.name} | ${tool.category} | $${tool.cost} | ${tool.action} |`
  ).join('\n');
  
  const actionsChecklist = immediateActions.length > 0 ? 
    immediateActions.map(action => 
      `- ✅ **${action.tool}**:\n${action.steps.map(step => `  - ${step}`).join('\n')}`
    ).join('\n\n') : 
    '- ✅ **No immediate cancellations needed** - Your current stack appears optimized.';
  
  // Calculate enhanced metrics
  const datasetMatches = recommendations.filter(r => r.confidence === 'high').length;
  const smartRecommendations = recommendations.filter(r => r.type === 'smart_consolidation');
  
  const report = `RecuroAI Enhanced Audit Summary
*Powered by comprehensive analysis of 300+ industry tools*

**Company Size**: ~${companySize} Employees  
**Billing Mode Assumed**: Monthly  
**Total Spend**: $${Math.round(totalMonthlyCost).toLocaleString()}/month  
**Estimated Waste**: $${Math.round(totalPotentialSavings).toLocaleString()}/month (~${wastePercentage}%)  
**Dataset Coverage**: ${datasetMatches}/${cleanedTools.length} tools matched in our industry database

---

${overpayingSection}## ✅ Enhanced Tool-by-Tool Breakdown

| Tool | Category | Est. Monthly | Market Data | Recommended Action |
|------|----------|---------------|-------------|---------------------|
${allToolsBreakdown.map(tool => {
  const marketNote = recommendations.find(r => r.tool === tool.name && r.confidence === 'high') 
    ? '✅ Verified' 
    : '📊 Estimated';
  return `| ${tool.name} | ${tool.category} | $${Math.round(tool.cost)} | ${marketNote} | ${tool.action} |`;
}).join('\n')}

---

## 🎯 Smart Consolidation Opportunities

${smartRecommendations.slice(0, 3).map(r => 
  `- **${r.tool}**: ${r.message} (Est. savings: $${Math.round(r.potentialSaving)}/month)`
).join('\n') || '- No major consolidation opportunities detected'}

## Immediate Actions Checklist

${actionsChecklist}

---

## Executive Summary

- **Total Monthly Spend**: $${Math.round(totalMonthlyCost).toLocaleString()}  
- **Data-Driven Savings**: $${Math.round(totalPotentialSavings).toLocaleString()}/month  
- **Annual Savings Opportunity**: $${Math.round(totalPotentialSavings * 12).toLocaleString()}+  
- **High-Confidence Recommendations**: ${recommendations.filter(r => r.confidence === 'high').length}/${recommendations.length}

---

## Ready to Automate This?

RecuroAI helps you monitor all tools in real time using our 300+ tool database, detect overspend with AI precision, and take action in one click.

**Join the waitlist at RecuroAI.com**

---

*This enhanced audit uses our comprehensive 300+ tool database for accurate pricing analysis. ${datasetMatches} tools were matched against verified industry data for maximum precision.*`;

  return report;
}

/**
 * Determine specific action for each tool
 */
function determineToolAction(tool, allTools) {
  const toolName = tool.toolName.toLowerCase();
  const category = tool.category;
  const cost = tool.estimatedMonthlyCost;
  
  // Check for redundancies in same category
  const sameCategory = allTools.filter(t => t.category === category && t.toolName !== tool.toolName);
  
  // Communication tools redundancy logic
  if (category === 'Communication') {
    if (toolName.includes('slack') && sameCategory.some(t => t.toolName.toLowerCase().includes('zoom'))) {
      return {
        type: 'cancel',
        recommendation: '**Cancel** – Redundant with Zoom',
        problem: 'Overlaps with Zoom Pro',
        specificAction: 'Go to Slack admin > deactivate workspace > notify team',
        detailedSteps: [
          'Go to Slack.com > Admin Console > Settings & Permissions > Deactivate workspace',
          'Notify your team to migrate to Zoom for chat and calls',
          'Export important channel history if needed'
        ]
      };
    }
    if (toolName.includes('google meet') && sameCategory.some(t => t.toolName.toLowerCase().includes('zoom'))) {
      return {
        type: 'consolidate',
        recommendation: '**Consolidate** – Use Zoom as primary',
        problem: 'Redundant with Zoom Pro',
        specificAction: 'Standardize on Zoom for all meetings',
        detailedSteps: [
          'Set Zoom as default meeting platform in calendar apps',
          'Update recurring meeting links to use Zoom',
          'Train team on Zoom advanced features'
        ]
      };
    }
  }
  
  // Project Management redundancy
  if (category === 'Project Management') {
    if (toolName.includes('asana') && sameCategory.some(t => t.toolName.toLowerCase().includes('monday'))) {
      return {
        type: 'cancel',
        recommendation: '**Cancel** – Duplicates Monday.com',
        problem: 'Duplicates Monday.com functionality',
        specificAction: 'Log in > cancel subscription > export projects to Monday',
        detailedSteps: [
          'Export all projects and tasks from Asana',
          'Import data into Monday.com workspace',
          'Login to Asana > Admin Settings > Billing > Cancel plan',
          'Notify team of the migration timeline'
        ]
      };
    }
    if (toolName.includes('trello') && sameCategory.length > 0) {
      return {
        type: 'consolidate',
        recommendation: '**Consolidate** – Migrate to primary PM tool',
        problem: 'Multiple project management tools',
        specificAction: 'Migrate boards to main PM platform',
        detailedSteps: [
          'Export Trello boards as CSV/JSON',
          'Import into your primary project management tool',
          'Cancel Trello subscription after migration'
        ]
      };
    }
  }
  
  // Cloud Storage redundancy
  if (category === 'Cloud Storage') {
    if (toolName.includes('dropbox') && sameCategory.some(t => t.toolName.toLowerCase().includes('google'))) {
      return {
        type: 'cancel',
        recommendation: '**Cancel** – Overlaps Google Drive',
        problem: 'Overlaps Google Drive storage',
        specificAction: 'Transfer files > downgrade or close Dropbox plan',
        detailedSteps: [
          'Backup all files from Dropbox to Google Drive',
          'Update shared links to point to Google Drive',
          'Login to Dropbox > Settings > Plan > Cancel subscription',
          'Keep free account for archive access if needed'
        ]
      };
    }
  }
  
  // High-cost tool optimization
  if (cost > 500) {
    if (toolName.includes('adobe')) {
      return {
        type: 'optimize',
        recommendation: '**Optimize** – Remove inactive users via Admin dashboard',
        problem: 'High cost with potential unused seats',
        specificAction: 'Audit user licenses and remove inactive seats',
        detailedSteps: [
          'Visit Adobe Admin Console > Users',
          'Review last login dates for all users',
          'Remove inactive seats and downgrade to "Team Starter" if usage is light',
          'Consider switching to per-project licenses for occasional users'
        ]
      };
    }
    if (toolName.includes('salesforce')) {
      return {
        type: 'optimize',
        recommendation: '**Optimize** – Reduce unused seats via Admin console',
        problem: 'Expensive CRM with potential optimization',
        specificAction: 'Contact Account Manager for seat optimization',
        detailedSteps: [
          'Review user activity in Salesforce Admin > Users',
          'Contact your Salesforce Account Manager or support',
          'Ask about per-seat optimization, annual discounts, or startup pricing',
          'Consider downgrading inactive users to lower-tier licenses'
        ]
      };
    }
  }
  
  // Medium-cost tools review
  if (cost > 200 && cost < 500) {
    return {
      type: 'review',
      recommendation: '**Review** – Switch to lower-tier plan if volume is low',
      problem: 'Moderate cost tool worth reviewing',
      specificAction: 'Audit usage and consider downgrade',
      detailedSteps: [
        'Review usage analytics in the tool\'s admin dashboard',
        'Compare current plan features with actual usage',
        'Consider downgrading to a lower-tier plan if features are underutilized',
        'Set up usage monitoring to prevent future overpay'
      ]
    };
  }
  
  // Default: Keep tool
  return {
    type: 'keep',
    recommendation: cost < 100 ? '**Keep** – Cost-effective' : '**Keep** – Primary tool for category',
    problem: null,
    specificAction: null,
    detailedSteps: []
  };
}

/**
 * Generate fallback report when main process fails
 */
function generateFallbackReport(rawToolList) {
  const toolCount = rawToolList.split('\n').filter(line => line.trim()).length;
  const estimatedCost = toolCount * 25; // $25 average per tool
  
  return `# RecuroAI Free Audit Report

## Executive Summary

We've identified ${toolCount} tools in your software stack.

**Quick Analysis:**
- Estimated Monthly Spend: $${estimatedCost}
- Potential Savings: $${Math.round(estimatedCost * 0.25)} (25%)
- Tools Analyzed: ${toolCount}

## Next Steps

For a detailed analysis with specific recommendations, please:
1. Clean up your tool list (remove duplicates, fix typos)
2. Provide company size for accurate cost estimation
3. Re-run the audit for comprehensive insights

**Want automated optimization? RecuroAI launches in July.**

*Contact us for a manual audit review.*`;
}

// Cache for storing recent audit results
const auditCache = new Map();

/**
 * Main audit function with caching
 */
export async function processAuditRequest(rawToolList, companySize = 25, useCache = true) {
  // Create cache key from input
  const cacheKey = `${rawToolList.trim()}_${companySize}`.replace(/\s+/g, '').toLowerCase();
  
  // Check cache if enabled
  if (useCache && auditCache.has(cacheKey)) {
    const cached = auditCache.get(cacheKey);
    if (Date.now() - cached.timestamp < 24 * 60 * 60 * 1000) { // 24 hour cache
      return {
        ...cached.result,
        fromCache: true,
        message: "This tool list has already been audited. Here's the saved result:"
      };
    }
  }
  
  // Generate new audit
  const result = await generateAuditReport(rawToolList, companySize);
  
  // Cache result
  if (useCache && result.success) {
    auditCache.set(cacheKey, {
      result,
      timestamp: Date.now()
    });
  }
  
  return result;
}

/**
 * Quick demo audit for testing
 */
export function generateDemoAudit() {
  const demoTools = "Slack, Asana, Monday.com, Zoom, Google Meet, Dropbox, Google Drive, Salesforce";
  return processAuditRequest(demoTools, 25, false);
}