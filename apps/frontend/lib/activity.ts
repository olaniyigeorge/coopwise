/**
 * Activity descriptions are free text written at log time, and they are not
 * consistent about the actor: "Contributed NGN 4500.00 to the group" has no
 * name, while "Ada Obi accepted an invite to join …" already starts with it.
 *
 * Returns the part of the sentence that should follow the actor's name, so the
 * UI can render `<name link> <rest>` without ever doubling the name.
 */
export function activityTextAfterActor(description: string, actorName?: string | null): string {
  const text = description.trim()
  if (!actorName) return text

  if (text.toLowerCase().startsWith(actorName.toLowerCase())) {
    return text.slice(actorName.length).trim()
  }
  // Verb-first ("Contributed …") — reads naturally after a name in lower case.
  return text.charAt(0).toLowerCase() + text.slice(1)
}
