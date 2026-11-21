# Your own wording for the instructions at the top of the "Copy message for
# ChatGPT" message. Null means Onward's built-in instructions, which live in
# frontend/src/lib/resume/tailorPrompt.ts so they can change with the app.
class AddTailorInstructionsToUsers < ActiveRecord::Migration[8.0]
  def change
    add_column :users, :tailor_instructions, :text
  end
end
