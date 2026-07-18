#!/usr/bin/env node

/**
 * TODO Scanner — inventories todo/fixme comments in PRODUCTION code.
 *
 * Tag convention (in code comments):
 *   todo(2.23): ...    → release-blocking for that version
 *   todo(release): ... → release-blocking for the NEXT release, whichever it is
 *   todo(site): ...    → website-side work (holithemes.com pages, docs)
 *   todo: ...          → backlog (no deadline)
 *   fixme: ...         → treated as backlog, flagged
 *
 * Usage:
 *   node dev/scripts/todo-scan.mjs             # full report
 *   node dev/scripts/todo-scan.mjs --release   # only release-blocking; exit 1 if any
 *                                              # (matches todo(release) and todo(<current version>))
 *
 * Output: terminal + dev/reports/todo/todo-report.md
 */

import fs from 'fs';
import path from 'path';
import { execSync } from 'child_process';
import { fileURLToPath } from 'url';
import { isExcluded } from './production-excludes.mjs';

const ROOT = path.resolve(path.dirname(fileURLToPath(import.meta.url)), '../../');
const releaseOnly = process.argv.includes('--release');

const version = (fs.readFileSync(path.join(ROOT, 'click-to-chat-files.php'), 'utf8').match(/^\s*\*?\s*Version:\s*([\d.]+)/m) || [])[1] || '';

// Production source files, honoring .gitignore via git ls-files
const files = execSync('git ls-files -- "*.php" "*.js" "*.css"', { cwd: ROOT, maxBuffer: 64 * 1024 * 1024 })
	.toString().trim().split('\n')
	.filter((f) => !isExcluded(f) && !/\.min\.|assets\/min\//.test(f));

// todo / to-do / fixme with optional (tag), inside a comment-ish context
const TODO_RE = /(?:\/\/|\/\*|\*|#|<!--)\s*(todo|to-do|fixme)(\(([^)]*)\))?\s*:?\s*(.*)/i;

const items = [];
for (const f of files) {
	const lines = fs.readFileSync(path.join(ROOT, f), 'utf8').split('\n');
	lines.forEach((line, i) => {
		const m = line.match(TODO_RE);
		if (!m) return;
		const kind = m[1].toLowerCase().replace('-', '');
		const tag = (m[3] || '').trim().toLowerCase();
		const text = (m[4] || '').replace(/\*\/\s*$/, '').replace(/-->\s*$/, '').replace(/\?>\s*$/, '').trim();
		let group = 'backlog';
		if (tag === 'release' || (version && tag === version)) group = 'release';
		else if (/^\d+\.\d+/.test(tag)) group = 'future'; // tagged for a later version
		else if (tag === 'site') group = 'site';
		else if (tag) group = 'tagged'; // free-form label (perf, security, i18n, check, ...)
		items.push({ file: f, line: i + 1, kind, tag, text, group });
	});
}

const GROUPS = [
	{ key: 'release', title: `RELEASE-BLOCKING (todo(release) / todo(${version || 'X.XX'}))` },
	{ key: 'site', title: 'WEBSITE-SIDE (todo(site))' },
	{ key: 'future', title: 'TAGGED FOR LATER VERSIONS' },
	{ key: 'tagged', title: 'CUSTOM TAGS (grouped by tag)' },
	{ key: 'backlog', title: 'BACKLOG (untagged)' },
];

let out = `# TODO report — v${version} · ${new Date().toISOString().slice(0, 10)}\n\n`;
out += `${items.length} todo/fixme comments in production code (${files.length} files scanned).\n`;
out += `Tag release-critical ones as \`todo(release):\` or \`todo(${version || 'X.XX'}):\` — \`npm run todo:scan -- --release\` gates on those.\n`;

for (const g of GROUPS) {
	const list = items.filter((i) => i.group === g.key);
	if (releaseOnly && g.key !== 'release') continue;
	out += `\n## ${g.title} — ${list.length}\n\n`;
	// Release/site groups: show all. Backlog: group per file to stay readable.
	if (g.key === 'release' || g.key === 'site' || g.key === 'future') {
		for (const i of list) out += `- ${i.file}:${i.line} — ${i.text || '(no text)'}\n`;
	} else if (g.key === 'tagged') {
		const byTag = new Map();
		for (const i of list) {
			if (!byTag.has(i.tag)) byTag.set(i.tag, []);
			byTag.get(i.tag).push(i);
		}
		for (const [t, titems] of [...byTag.entries()].sort((a, b) => b[1].length - a[1].length)) {
			out += `- **(${t})** (${titems.length})\n`;
			for (const i of titems) out += `  - ${i.file}:${i.line} — ${i.text || '(no text)'}\n`;
		}
	} else {
		const byFile = new Map();
		for (const i of list) {
			if (!byFile.has(i.file)) byFile.set(i.file, []);
			byFile.get(i.file).push(i);
		}
		for (const [f, fitems] of [...byFile.entries()].sort((a, b) => b[1].length - a[1].length)) {
			out += `- **${f}** (${fitems.length})\n`;
			for (const i of fitems) out += `  - :${i.line} ${i.text || '(no text)'}\n`;
		}
	}
}

const REPORT_DIR = path.join(ROOT, 'dev/reports/todo');
fs.mkdirSync(REPORT_DIR, { recursive: true });
fs.writeFileSync(path.join(REPORT_DIR, 'todo-report.md'), out);

// ── Change tracking: compare against the previous scan snapshot ──
// Identity = file + normalized text (line numbers shift too easily).
const STATE = path.join(REPORT_DIR, 'todo-state.json');
const idOf = (i) => `${i.file}::${i.text.toLowerCase().replace(/\s+/g, ' ').slice(0, 80)}`;
let prev = null;
try { prev = JSON.parse(fs.readFileSync(STATE, 'utf8')); } catch { /* first run */ }
const currentIds = new Set(items.map(idOf));
const added = prev ? items.filter((i) => !prev.ids.includes(idOf(i))) : [];
const resolved = prev ? prev.items.filter((i) => !currentIds.has(idOf(i))) : [];
if (!releaseOnly) {
	fs.writeFileSync(STATE, JSON.stringify({
		date: new Date().toISOString(),
		ids: [...currentIds],
		items: items.map((i) => ({ file: i.file, line: i.line, text: i.text, group: i.group })),
	}, null, '\t'));
}

// ── HTML report (same design language as the PCP report) ──
const esc = (s) => String(s).replace(/&/g, '&amp;').replace(/</g, '&lt;').replace(/>/g, '&gt;');
const GROUP_META = {
	release: { title: 'Release-blocking', cls: 'rel', hint: `todo(release) / todo(${version || 'X.XX'})` },
	site: { title: 'Website-side', cls: 'site', hint: 'todo(site) — holithemes.com work' },
	future: { title: 'Later versions', cls: 'future', hint: 'todo(X.XX) for a future version' },
	tagged: { title: 'Custom tags', cls: 'tag', hint: 'free-form labels — todo(perf), todo(security), ...' },
	backlog: { title: 'Backlog', cls: 'back', hint: 'plain todo: — no deadline' },
};

const renderGroup = (key) => {
	const list = items.filter((i) => i.group === key);
	if (!list.length) return '';
	const meta = GROUP_META[key];
	const byKey = new Map();
	for (const i of list) {
		const k = key === 'tagged' ? `(${i.tag})` : i.file;
		if (!byKey.has(k)) byKey.set(k, []);
		byKey.get(k).push(i);
	}
	const sections = [...byKey.entries()].sort((a, b) => b[1].length - a[1].length).map(([f, fitems]) => `
	<section class="${key === 'release' ? 'has-error' : ''}">
		<h2><code>${esc(f)}</code><span class="count">${fitems.length}</span></h2>
		${fitems.map((i) => `
		<div class="finding">
			<span class="badge ${meta.cls}">${i.kind === 'fixme' ? 'FIXME' : 'TODO'}${i.tag ? `<br><span class="tag">(${esc(i.tag)})</span>` : ''}</span>
			<div class="body">
				<div class="msg">${esc(i.text || '(no text)')}</div>
				<div class="meta">${key === 'tagged' ? `<code>${esc(i.file)}</code> · ` : ''}line ${i.line}</div>
			</div>
		</div>`).join('')}
	</section>`).join('');
	return `<h2 class="section-title">${meta.title} (${list.length}) <span class="hint">${meta.hint}</span></h2>${sections}`;
};

const changesHtml = prev ? `
	<div class="changes">
		<span class="chg add">+${added.length} new</span>
		<span class="chg res">−${resolved.length} resolved</span>
		<span class="chg since">since ${prev.date.slice(0, 10)}</span>
	</div>
	${added.length ? `<details class="chg-list" open><summary>New since last scan</summary>${added.map((i) => `<div class="chg-item">+ <code>${esc(i.file)}:${i.line}</code> ${esc(i.text)}</div>`).join('')}</details>` : ''}
	${resolved.length ? `<details class="chg-list"><summary>Resolved since last scan</summary>${resolved.map((i) => `<div class="chg-item">− <code>${esc(i.file)}</code> ${esc(i.text)}</div>`).join('')}</details>` : ''}` : '';

const counts = Object.fromEntries(Object.keys(GROUP_META).map((k) => [k, items.filter((i) => i.group === k).length]));
const html = `<!DOCTYPE html>
<html lang="en"><head><meta charset="utf-8">
<meta name="viewport" content="width=device-width, initial-scale=1">
<title>TODOs — Click to Chat Files v${esc(version)}</title>
<style>
	:root { --err:#d63638; --warn:#996800; --ok:#00844b; --line:#e2e4e7; }
	* { box-sizing:border-box; }
	body { font:15px/1.55 -apple-system,BlinkMacSystemFont,"Segoe UI",Roboto,sans-serif; margin:0; background:#f6f7f7; color:#1d2327; }
	.wrap { max-width:860px; margin:0 auto; padding:32px 20px 64px; }
	h1 { font-size:22px; margin:0 0 4px; }
	.sub { color:#646970; margin-bottom:20px; }
	.cards { display:flex; gap:12px; margin-bottom:16px; flex-wrap:wrap; }
	.card { background:#fff; border:1px solid var(--line); border-radius:10px; padding:14px 20px; min-width:120px; }
	.card .n { font-size:28px; font-weight:700; }
	.card.rel .n { color:var(--err); } .card.site .n { color:#7c3aed; } .card.future .n { color:#2271b1; } .card.tag .n { color:#996800; } .card.back .n { color:#646970; }
	.card .l { color:#646970; font-size:13px; }
	.changes { margin-bottom:16px; }
	.chg { display:inline-block; border-radius:99px; padding:3px 12px; font-size:13px; font-weight:600; margin-right:8px; }
	.chg.add { background:#fcf0f1; color:var(--err); }
	.chg.res { background:#edf9f2; color:var(--ok); }
	.chg.since { background:#f0f0f1; color:#646970; font-weight:400; }
	.chg-list { background:#fff; border:1px solid var(--line); border-radius:10px; margin-bottom:12px; padding:0 14px; }
	.chg-list summary { padding:10px 4px; cursor:pointer; color:#646970; font-size:13.5px; font-weight:600; }
	.chg-item { padding:4px 4px 8px; font-size:13.5px; }
	.chg-item code { background:#f0f0f1; padding:1px 6px; border-radius:4px; font-size:12.5px; }
	.section-title { font-size:16px; margin:36px 0 14px; }
	.section-title .hint { font-weight:400; font-size:13px; color:#646970; margin-left:6px; }
	section { background:#fff; border:1px solid var(--line); border-radius:10px; margin-bottom:16px; overflow:hidden; }
	section.has-error { border-left:4px solid var(--err); }
	section h2 { font-size:14px; margin:0; padding:12px 18px; background:#fafafa; border-bottom:1px solid var(--line); display:flex; align-items:center; gap:10px; }
	section h2 code { font-size:13px; word-break:break-all; }
	.count { margin-left:auto; background:#f0f0f1; border-radius:99px; padding:1px 10px; font-size:12px; color:#646970; }
	.finding { display:flex; gap:14px; padding:12px 18px; border-bottom:1px solid #f0f0f1; }
	.finding:last-child { border-bottom:0; }
	.badge { flex:0 0 84px; font-size:12px; font-weight:700; padding-top:2px; }
	.badge.rel { color:var(--err); } .badge.site { color:#7c3aed; } .badge.future { color:#2271b1; } .badge.tag { color:#996800; } .badge.back { color:#8c8f94; }
	.badge .tag { font-weight:600; font-size:11px; }
	.msg { margin-bottom:2px; }
	.meta { font-size:12.5px; color:#646970; }
</style></head><body><div class="wrap">
	<h1>TODO Report</h1>
	<div class="sub">click-to-chat-files · v${esc(version)} · ${new Date().toLocaleString()} · ${files.length} files scanned</div>
	<div class="cards">
		<div class="card rel"><div class="n">${counts.release}</div><div class="l">Release-blocking</div></div>
		<div class="card site"><div class="n">${counts.site}</div><div class="l">Website-side</div></div>
		<div class="card future"><div class="n">${counts.future}</div><div class="l">Later versions</div></div>
		<div class="card tag"><div class="n">${counts.tagged}</div><div class="l">Custom tags</div></div>
		<div class="card back"><div class="n">${counts.backlog}</div><div class="l">Backlog</div></div>
	</div>
	${changesHtml}
	${['release', 'site', 'future', 'tagged', 'backlog'].map(renderGroup).join('')}
</div></body></html>`;
fs.writeFileSync(path.join(REPORT_DIR, 'todo-report.html'), html);

console.log(out);
if (prev) console.log(`Changes since ${prev.date.slice(0, 10)}: +${added.length} new, −${resolved.length} resolved`);
console.log(`Reports → dev/reports/todo/ (todo-report.md, todo-report.html)`);

const blocking = items.filter((i) => i.group === 'release').length;
if (releaseOnly && blocking > 0) {
	console.error(`\n❌ ${blocking} release-blocking TODO(s) — resolve or retag before release.`);
	process.exit(1);
}
