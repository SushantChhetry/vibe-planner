/** Layout regions added on the page canvas (inside a page). */
export const PAGE_LAYOUT_BLOCK_TYPES = [
  "Navbar",
  "Hero",
  "Sidebar",
  "Footer",
  "Form",
  "Content section",
  "Dashboard",
  "Data Table",
  "Chart",
  "Auth/Login",
  "Modal",
  "Settings",
  "Cards Grid",
  "Feed/List",
  "Empty State",
  "Custom",
] as const;

export const BLOCK_TYPES = PAGE_LAYOUT_BLOCK_TYPES;

export type BlockType = (typeof BLOCK_TYPES)[number];

export const WIRE_ELEMENT_TYPES = [
  "Heading",
  "Section",
  "Body text",
  "Image",
  "Primary button",
  "Secondary button",
  "Input",
  "List",
  "Divider",
  "Spacer",
  "Custom",
] as const;

export type WireElementType = (typeof WIRE_ELEMENT_TYPES)[number];

export type Profile = {
  id: string;
  email: string | null;
  created_at: string;
  stripe_customer_id?: string | null;
  stripe_subscription_id?: string | null;
  subscription_status?: string | null;
};

export type Project = {
  id: string;
  user_id: string;
  name: string;
  created_at: string;
  updated_at: string;
};

export type PageRow = {
  id: string;
  project_id: string;
  name: string;
  order: number;
  description: string;
  /** Null until first site map save — client lays out on a grid when unset. */
  sitemap_x: number | null;
  sitemap_y: number | null;
};

/** Site map node (React Flow). */
export type PageNodeData = {
  name: string;
  description: string;
};

export type PageNavigationEdgeRow = {
  id: string;
  project_id: string;
  source_page_id: string;
  target_page_id: string;
  label: string | null;
};

/** Extra behavior for buttons (nav / click intent) and form fields. Stored as JSON on wireframe_elements.meta. */
export type WireframeElementMeta = {
  linkPageId?: string | null;
  onClickDescription?: string;
  /** For Input: text, email, password, number, textarea, select, checkbox, … */
  inputType?: string;
  /** For Input: validation, submit binding, or what happens with the value */
  fieldBehavior?: string;
};

export type BlockRow = {
  id: string;
  page_id: string;
  type: string;
  name: string;
  description: string;
  position_x: number;
  position_y: number;
  created_at: string;
};

export type WireframeElementRow = {
  id: string;
  parent_block_id: string;
  element_type: string;
  label: string;
  sort_order: number;
  created_at: string;
  /** Left offset on the wireframe artboard (px). */
  frame_x: number;
  /** Top offset on the wireframe artboard (px). */
  frame_y: number;
  frame_w: number;
  frame_h: number;
  meta: WireframeElementMeta;
};

/** Block as loaded from API with nested wireframes */
export type BundleBlock = BlockRow & {
  wireframe_elements: WireframeElementRow[];
};

export type EdgeRow = {
  id: string;
  page_id: string;
  source_block_id: string;
  target_block_id: string;
  label: string | null;
};

export type BlockNodeData = {
  blockType: BlockType;
  name: string;
  description: string;
};

export type ExportFormat = "markdown" | "cursorrules" | "claude" | "json";

export type ExportWireItem = {
  element_type: string;
  label: string;
  frame_x: number;
  frame_y: number;
  frame_w: number;
  frame_h: number;
  meta?: WireframeElementMeta;
};

export type ExportBlock = {
  id: string;
  type: string;
  name: string;
  description: string;
  position_x: number;
  position_y: number;
  wireframe: ExportWireItem[];
};

export type ExportEdge = {
  id: string;
  source_block_id: string;
  target_block_id: string;
  label: string | null;
};

export type ExportPage = {
  id: string;
  name: string;
  order: number;
  description?: string;
  blocks: ExportBlock[];
  edges: ExportEdge[];
};

export type ExportPageNav = {
  id: string;
  source_page_id: string;
  target_page_id: string;
  label: string | null;
};

export type ExportSnapshot = {
  projectName: string;
  pages: ExportPage[];
  pageNavigation: ExportPageNav[];
};

export type ProjectBundle = {
  project: { id: string; name: string };
  pages: {
    id: string;
    name: string;
    order: number;
    description: string;
    sitemap_x: number | null;
    sitemap_y: number | null;
    blocks: BundleBlock[];
    edges: EdgeRow[];
  }[];
  page_navigation_edges: PageNavigationEdgeRow[];
};

/** Tab id for the project-wide site map canvas */
export const SITE_MAP_TAB_ID = "__site_map__" as const;
