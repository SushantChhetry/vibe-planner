import type { BlockType, WireElementType, WireframeElementRow } from "@/lib/types";

export type TemplateWireStub = Pick<
  WireframeElementRow,
  "element_type" | "label" | "frame_x" | "frame_y" | "frame_w" | "frame_h"
>;

export type TemplateBlockStub = {
  type: BlockType;
  name: string;
  description: string;
  x: number;
  y: number;
  /** Inner wireframe layout for this block when the template is applied. */
  wireframe: TemplateWireStub[];
};

export type TemplateEdgeStub = {
  from: number;
  to: number;
  label?: string;
};

export type AppTemplate = {
  id: string;
  label: string;
  blocks: TemplateBlockStub[];
  edges: TemplateEdgeStub[];
};

function wf(
  element_type: WireElementType,
  label: string,
  frame_x: number,
  frame_y: number,
  frame_w: number,
  frame_h: number
): TemplateWireStub {
  return { element_type, label, frame_x, frame_y, frame_w, frame_h };
}

/** Build client wireframe rows for a new block id (call from browser only). */
export function templateWireStubsToRows(
  blockId: string,
  stubs: TemplateWireStub[]
): WireframeElementRow[] {
  const now = new Date().toISOString();
  return stubs.map((s, sort_order) => ({
    id: crypto.randomUUID(),
    parent_block_id: blockId,
    element_type: s.element_type,
    label: s.label,
    sort_order,
    created_at: now,
    frame_x: s.frame_x,
    frame_y: s.frame_y,
    frame_w: s.frame_w,
    frame_h: s.frame_h,
    meta: {},
  }));
}

/** Stack all template block wireframes onto a single page host block (page-level editor). */
export function flattenTemplateToWireRows(
  template: AppTemplate,
  hostBlockId: string
): WireframeElementRow[] {
  let yOff = 0;
  const out: WireframeElementRow[] = [];
  for (const stub of template.blocks) {
    if (stub.wireframe.length === 0) {
      yOff += 48;
      continue;
    }
    const shifted = stub.wireframe.map((w) => ({
      ...w,
      frame_y: w.frame_y + yOff,
    }));
    out.push(...templateWireStubsToRows(hostBlockId, shifted));
    const bottom = Math.max(...stub.wireframe.map((w) => w.frame_y + w.frame_h));
    yOff += bottom + 24;
  }
  return out;
}

/** Simple starters — available on every plan. */
export const BASIC_TEMPLATES: AppTemplate[] = [
  {
    id: "starter-blank",
    label: "Blank starter",
    blocks: [
      {
        type: "Custom",
        name: "First screen",
        description: "Rename and sketch your flow",
        x: 200,
        y: 180,
        wireframe: [
          wf("Heading", "Your page wireframe starts here", 24, 24, 400, 44),
          wf(
            "Body text",
            "Add sections and elements from the toolbar. Link buttons to other pages on the site map.",
            24,
            80,
            440,
            72
          ),
        ],
      },
    ],
    edges: [],
  },
  {
    id: "starter-landing",
    label: "Simple landing",
    blocks: [
      {
        type: "Navbar",
        name: "Nav",
        description: "Logo and links",
        x: 80,
        y: 60,
        wireframe: [
          wf("Heading", "Your product", 24, 20, 200, 40),
          wf("List", "Features · Pricing · Contact", 280, 18, 320, 80),
        ],
      },
      {
        type: "Hero",
        name: "Hero",
        description: "Headline and CTA",
        x: 80,
        y: 220,
        wireframe: [
          wf("Heading", "A clear headline", 24, 32, 480, 52),
          wf("Body text", "Short value proposition for visitors.", 24, 100, 480, 64),
          wf("Primary button", "Get started", 24, 180, 160, 48),
        ],
      },
      {
        type: "Footer",
        name: "Footer",
        description: "Links",
        x: 80,
        y: 420,
        wireframe: [wf("List", "© Company · Privacy · Terms", 24, 24, 600, 48)],
      },
    ],
    edges: [
      { from: 0, to: 1 },
      { from: 1, to: 2 },
    ],
  },
  {
    id: "starter-dashboard",
    label: "App shell",
    blocks: [
      {
        type: "Navbar",
        name: "Top bar",
        description: "Global navigation",
        x: 80,
        y: 40,
        wireframe: [
          wf("Heading", "App", 24, 20, 120, 36),
          wf("Primary button", "Account", 640, 18, 120, 44),
        ],
      },
      {
        type: "Sidebar",
        name: "Side nav",
        description: "Sections",
        x: 80,
        y: 160,
        wireframe: [wf("List", "Home · Reports · Settings", 24, 24, 200, 200)],
      },
      {
        type: "Dashboard",
        name: "Main content",
        description: "Default view",
        x: 300,
        y: 160,
        wireframe: [
          wf("Heading", "Overview", 24, 24, 400, 40),
          wf("Body text", "Charts, tables, or cards go here.", 24, 80, 500, 80),
        ],
      },
    ],
    edges: [
      { from: 0, to: 1 },
      { from: 0, to: 2 },
      { from: 1, to: 2 },
    ],
  },
  {
    id: "starter-login-flow",
    label: "Login → home",
    blocks: [
      {
        type: "Auth/Login",
        name: "Sign in",
        description: "Auth screen",
        x: 120,
        y: 120,
        wireframe: [
          wf("Heading", "Sign in", 24, 24, 320, 40),
          wf("Input", "Email", 24, 80, 320, 48),
          wf("Input", "Password", 24, 144, 320, 48),
          wf("Primary button", "Continue", 24, 212, 320, 48),
        ],
      },
      {
        type: "Dashboard",
        name: "Home",
        description: "After login",
        x: 480,
        y: 120,
        wireframe: [
          wf("Heading", "Welcome back", 24, 24, 360, 40),
          wf("Body text", "Your main dashboard after authentication.", 24, 72, 400, 64),
        ],
      },
    ],
    edges: [{ from: 0, to: 1, label: "Success" }],
  },
];

/** Full blueprints with rich wireframes — Premium in the UI. */
export const AI_TEMPLATES: AppTemplate[] = [
  {
    id: "saas",
    label: "SaaS app",
    blocks: [
      {
        type: "Navbar",
        name: "App shell",
        description: "Logo, nav, user menu",
        x: 80,
        y: 40,
        wireframe: [
          wf("Image", "", 24, 20, 56, 56),
          wf("Heading", "Acme Console", 96, 26, 220, 44),
          wf("List", "Dashboard · Records · Reports · Settings", 328, 22, 360, 104),
          wf("Primary button", "User menu", 712, 26, 136, 48),
        ],
      },
      {
        type: "Sidebar",
        name: "Primary nav",
        description: "Sections and shortcuts",
        x: 80,
        y: 200,
        wireframe: [
          wf("Heading", "Workspace", 24, 24, 240, 40),
          wf("List", "Overview · Clients · Tasks · Archive", 24, 80, 280, 168),
          wf("Divider", "", 24, 264, 304, 28),
          wf("Secondary button", "Collapse sidebar", 24, 304, 176, 48),
        ],
      },
      {
        type: "Dashboard",
        name: "Overview",
        description: "KPIs and activity",
        x: 380,
        y: 200,
        wireframe: [
          wf("Heading", "Overview", 24, 24, 440, 44),
          wf("Custom", "KPI tiles: MRR · active users · churn", 24, 84, 820, 112),
          wf("Divider", "", 24, 212, 820, 28),
          wf("Heading", "Recent activity", 24, 256, 320, 38),
          wf("List", "Latest events and edits", 24, 308, 820, 160),
        ],
      },
      {
        type: "Data Table",
        name: "Records",
        description: "List/detail for main entity",
        x: 380,
        y: 460,
        wireframe: [
          wf("Heading", "All records", 24, 24, 280, 44),
          wf("Input", "Search, filter…", 560, 24, 280, 48),
          wf("Custom", "Sortable table · row actions · pagination", 24, 88, 832, 260),
          wf("Secondary button", "Export CSV", 24, 364, 160, 48),
        ],
      },
      {
        type: "Settings",
        name: "Settings",
        description: "Profile, billing, team",
        x: 680,
        y: 200,
        wireframe: [
          wf("Heading", "Settings", 24, 24, 320, 44),
          wf("List", "Profile · Billing · Team · API keys", 24, 88, 240, 200),
          wf("Heading", "Profile", 328, 88, 200, 36),
          wf("Input", "Full name", 328, 136, 400, 48),
          wf("Input", "Work email", 328, 200, 400, 48),
          wf("Primary button", "Save changes", 328, 264, 176, 48),
        ],
      },
      {
        type: "Auth/Login",
        name: "Sign in",
        description: "Email magic link or SSO",
        x: 680,
        y: 460,
        wireframe: [
          wf("Heading", "Sign in to Acme", 24, 24, 440, 48),
          wf("Body text", "Use your work email. We’ll send a magic link or you can use SSO.", 24, 88, 440, 80),
          wf("Input", "Email address", 24, 184, 440, 48),
          wf("Input", "Password (optional)", 24, 248, 440, 48),
          wf("Primary button", "Continue", 24, 312, 440, 52),
          wf("Secondary button", "Sign in with SSO", 24, 380, 200, 44),
        ],
      },
    ],
    edges: [
      { from: 0, to: 1, label: "Navigate" },
      { from: 1, to: 2 },
      { from: 2, to: 3, label: "Drill down" },
      { from: 1, to: 4 },
      { from: 0, to: 5, label: "Logged out" },
    ],
  },
  {
    id: "landing",
    label: "Landing page",
    blocks: [
      {
        type: "Navbar",
        name: "Marketing nav",
        description: "Logo, links, CTA",
        x: 80,
        y: 40,
        wireframe: [
          wf("Image", "", 24, 22, 48, 48),
          wf("Heading", "Lumen", 88, 26, 144, 40),
          wf("List", "Product · Pricing · Customers · Blog", 260, 22, 380, 96),
          wf("Primary button", "Start free", 688, 24, 152, 48),
        ],
      },
      {
        type: "Hero",
        name: "Hero",
        description: "Headline, subcopy, primary CTA",
        x: 80,
        y: 200,
        wireframe: [
          wf("Heading", "Ship product your team actually loves", 24, 32, 520, 60),
          wf(
            "Body text",
            "Planning, specs, and handoff in one place. No more scattered docs.",
            24,
            108,
            520,
            96
          ),
          wf("Primary button", "Start free trial", 24, 220, 184, 52),
          wf("Secondary button", "Watch demo", 224, 222, 152, 48),
          wf("Image", "Product screenshot / hero visual", 568, 28, 280, 264),
        ],
      },
      {
        type: "Cards Grid",
        name: "Features",
        description: "Three pillars or benefits",
        x: 80,
        y: 420,
        wireframe: [
          wf("Heading", "Why teams choose Lumen", 24, 24, 640, 44),
          wf("Body text", "Three core benefits that map to your positioning.", 24, 80, 720, 56),
          wf("Image", "Feature 1", 24, 152, 240, 128),
          wf("Heading", "Clarity", 24, 292, 240, 36),
          wf(
            "Body text",
            "Shared context so everyone knows what to build next.",
            24,
            336,
            240,
            72
          ),
          wf("Image", "Feature 2", 280, 152, 240, 128),
          wf("Heading", "Speed", 280, 292, 240, 36),
          wf("Body text", "Templates and AI-assisted drafts cut planning time.", 280, 336, 240, 72),
          wf("Image", "Feature 3", 536, 152, 240, 128),
          wf("Heading", "Handoff", 536, 292, 240, 36),
          wf("Body text", "Exports and rules that plug into your dev workflow.", 536, 336, 240, 72),
        ],
      },
      {
        type: "Form",
        name: "Lead capture",
        description: "Email signup or demo request",
        x: 480,
        y: 420,
        wireframe: [
          wf("Heading", "Get the product playbook", 24, 24, 360, 44),
          wf("Body text", "Weekly tips. No spam—unsubscribe anytime.", 24, 80, 360, 56),
          wf("Input", "Work email", 24, 152, 360, 48),
          wf("Input", "Company (optional)", 24, 216, 360, 48),
          wf("Primary button", "Send me the guide", 24, 280, 360, 52),
        ],
      },
      {
        type: "Footer",
        name: "Footer",
        description: "Links, legal, social",
        x: 80,
        y: 640,
        wireframe: [
          wf("List", "Product · Company · Resources · Legal", 24, 24, 800, 88),
          wf("Divider", "", 24, 120, 800, 28),
          wf("Body text", "© 2026 Acme Inc. · Privacy · Terms", 24, 160, 560, 56),
        ],
      },
    ],
    edges: [
      { from: 0, to: 1 },
      { from: 1, to: 2 },
      { from: 1, to: 3, label: "CTA" },
      { from: 2, to: 4 },
    ],
  },
  {
    id: "mobile",
    label: "Mobile app",
    blocks: [
      {
        type: "Navbar",
        name: "Top bar",
        description: "Title + actions",
        x: 120,
        y: 60,
        wireframe: [
          wf("Secondary button", "Menu", 24, 16, 56, 44),
          wf("Heading", "Home", 96, 20, 224, 40),
          wf("Primary button", "Create", 680, 18, 128, 44),
        ],
      },
      {
        type: "Feed/List",
        name: "Home feed",
        description: "Infinite scroll timeline",
        x: 120,
        y: 220,
        wireframe: [
          wf("Heading", "For you", 24, 24, 200, 40),
          wf("List", "Scrollable cards · pull to refresh", 24, 80, 760, 320),
        ],
      },
      {
        type: "Modal",
        name: "Composer",
        description: "Create new item",
        x: 420,
        y: 220,
        wireframe: [
          wf("Heading", "New post", 24, 24, 400, 40),
          wf("Body text", "What do you want to share?", 24, 80, 520, 100),
          wf("Primary button", "Publish", 24, 200, 136, 48),
          wf("Secondary button", "Cancel", 176, 202, 120, 44),
        ],
      },
      {
        type: "Settings",
        name: "Account",
        description: "Preferences and logout",
        x: 420,
        y: 420,
        wireframe: [
          wf("Heading", "Account", 24, 24, 240, 40),
          wf("List", "Profile · Notifications · Privacy · Log out", 24, 80, 320, 220),
        ],
      },
      {
        type: "Empty State",
        name: "No items",
        description: "First-run guidance",
        x: 120,
        y: 420,
        wireframe: [
          wf("Image", "Illustration placeholder", 24, 48, 200, 160),
          wf("Heading", "No posts yet", 248, 64, 400, 48),
          wf("Body text", "When you or your teammates publish, they’ll show up here.", 248, 128, 480, 72),
          wf("Primary button", "Create first post", 248, 216, 200, 48),
        ],
      },
    ],
    edges: [
      { from: 0, to: 1 },
      { from: 1, to: 2, label: "FAB" },
      { from: 0, to: 3, label: "Menu" },
      { from: 1, to: 4, label: "No data" },
    ],
  },
  {
    id: "ecommerce",
    label: "E-commerce",
    blocks: [
      {
        type: "Navbar",
        name: "Store header",
        description: "Search, cart, categories",
        x: 80,
        y: 40,
        wireframe: [
          wf("Heading", "Northwind", 24, 24, 168, 40),
          wf("Input", "Search products…", 216, 24, 280, 48),
          wf("List", "Men · Women · Sale · New", 528, 20, 240, 104),
          wf("Primary button", "Cart · 2", 792, 24, 120, 48),
        ],
      },
      {
        type: "Hero",
        name: "Campaign",
        description: "Promo banner",
        x: 80,
        y: 180,
        wireframe: [
          wf("Image", "Seasonal campaign / lookbook", 24, 24, 832, 168),
          wf("Heading", "Spring collection — 20% off", 24, 208, 560, 48),
          wf("Primary button", "Shop the drop", 24, 272, 184, 48),
        ],
      },
      {
        type: "Cards Grid",
        name: "PLP",
        description: "Product listing",
        x: 80,
        y: 400,
        wireframe: [
          wf("Heading", "All products", 24, 24, 360, 40),
          wf("Input", "Filter & sort…", 472, 24, 384, 48),
          wf("Image", "Product 1", 24, 88, 256, 160),
          wf("Image", "Product 2", 296, 88, 256, 160),
          wf("Image", "Product 3", 568, 88, 256, 160),
          wf("Image", "Product 4", 24, 264, 256, 160),
          wf("Image", "Product 5", 296, 264, 256, 160),
          wf("Image", "Product 6", 568, 264, 256, 160),
        ],
      },
      {
        type: "Modal",
        name: "Quick view",
        description: "Product modal",
        x: 520,
        y: 400,
        wireframe: [
          wf("Image", "Product gallery", 24, 24, 280, 200),
          wf("Heading", "Organic cotton hoodie", 328, 24, 400, 44),
          wf("Body text", "$89 · 4 colors · In stock", 328, 80, 400, 72),
          wf("Primary button", "Add to cart", 328, 168, 200, 48),
          wf("Secondary button", "Close", 544, 170, 120, 44),
        ],
      },
      {
        type: "Form",
        name: "Checkout",
        description: "Shipping + payment",
        x: 520,
        y: 180,
        wireframe: [
          wf("Heading", "Checkout", 24, 24, 400, 40),
          wf("Input", "Shipping address", 24, 80, 400, 48),
          wf("Input", "City, state, ZIP", 24, 144, 400, 48),
          wf("Input", "Payment method / card", 24, 208, 400, 48),
          wf("Primary button", "Pay securely", 24, 280, 400, 52),
        ],
      },
      {
        type: "Footer",
        name: "Footer",
        description: "Support, policy",
        x: 80,
        y: 620,
        wireframe: [
          wf("List", "Help · Returns · Shipping · Privacy · Terms", 24, 24, 820, 88),
          wf("Body text", "Customer support · social links", 24, 120, 600, 56),
        ],
      },
    ],
    edges: [
      { from: 0, to: 1 },
      { from: 1, to: 2 },
      { from: 2, to: 3, label: "Product" },
      { from: 3, to: 4, label: "Buy" },
      { from: 2, to: 5 },
    ],
  },
];

/** All templates (basic + AI); used to resolve IDs when applying. */
export const TEMPLATES: AppTemplate[] = [...BASIC_TEMPLATES, ...AI_TEMPLATES];
