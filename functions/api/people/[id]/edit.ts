// functions/api/people/[id]/edit.ts
// GET  /api/people/:id/edit — HTML form for manual profile editing
// POST /api/people/:id/edit — handle form submission
import { getPersonById, updatePerson, createTool, createFollow } from '../../../../lib/db';
import { authenticateSession, jsonError } from '../../../../lib/auth';

interface Env {
  DB: D1Database;
}

const formHtml = (person: any) => `<!DOCTYPE html>
<html lang="en">
<head>
  <meta charset="utf-8">
  <meta name="viewport" content="width=device-width, initial-scale=1">
  <title>Edit Profile — ito.md</title>
  <link rel="stylesheet" href="/style.css">
</head>
<body>
  <main id="content">
    <h1>Edit Profile</h1>
    <p>Editing: ${person.display_name || person.github_username || person.id}</p>
    <form method="POST">
      <label>Bio<br><textarea name="bio" rows="4" cols="60">${person.bio || ''}</textarea></label><br><br>
      <label>Setup (tools, workflows)<br><textarea name="setup" rows="6" cols="60">${person.setup || ''}</textarea></label><br><br>
      <h2>Add a Tool</h2>
      <label>Name <input name="tool_name" type="text" size="30"></label><br>
      <label>URL <input name="tool_url" type="text" size="50"></label><br>
      <label>Tags (comma-separated) <input name="tool_tags" type="text" size="50"></label><br>
      <label>Note <input name="tool_note" type="text" size="50"></label><br><br>
      <h2>Follow Someone</h2>
      <label>GitHub username <input name="follow_github" type="text" size="30"></label><br>
      <label>Note <input name="follow_note" type="text" size="50"></label><br><br>
      <button type="submit">Save</button>
    </form>
  </main>
</body>
</html>`;

export const onRequestGet: PagesFunction<Env> = async (context) => {
  const { request, env, params } = context;
  const id = params.id as string;

  const person = await authenticateSession(request, env.DB);
  if (!person || person.id !== id) {
    return new Response('You must be logged in to edit this profile.', { status: 401 });
  }

  return new Response(formHtml(person), {
    status: 200,
    headers: { 'Content-Type': 'text/html; charset=utf-8' },
  });
};

export const onRequestPost: PagesFunction<Env> = async (context) => {
  const { request, env, params } = context;
  const id = params.id as string;

  const person = await authenticateSession(request, env.DB);
  if (!person || person.id !== id) {
    return new Response('Unauthorized', { status: 401 });
  }

  const formData = await request.formData();
  const bio = formData.get('bio') as string;
  const setup = formData.get('setup') as string;

  // Update profile
  if (bio || setup) {
    await updatePerson(env.DB, id, { bio, setup } as any);
  }

  // Add tool if provided
  const toolName = formData.get('tool_name') as string;
  if (toolName) {
    const toolUrl = formData.get('tool_url') as string;
    const toolTags = formData.get('tool_tags') as string;
    const toolNote = formData.get('tool_note') as string;
    await createTool(env.DB, {
      person_id: id,
      name: toolName,
      url: toolUrl || null,
      tags: toolTags ? JSON.stringify(toolTags.split(',').map(t => t.trim()).filter(Boolean)) : null,
      note: toolNote || null,
    });
  }

  // Add follow if provided
  const followGithub = formData.get('follow_github') as string;
  if (followGithub) {
    const followNote = formData.get('follow_note') as string;
    await createFollow(env.DB, {
      person_id: id,
      target_github: followGithub,
      note: followNote || null,
    });
  }

  // Redirect back to profile
  return new Response(null, {
    status: 302,
    headers: { Location: `/people/${id}` },
  });
};
