# A one-time code that lets someone create an account when sign-ups are
# invite-only. Admins make them on the Account page and share the link.
class Invite < ApplicationRecord
  # No 0/O or 1/I/L, so codes are easy to read aloud or type.
  ALPHABET = "ABCDEFGHJKMNPQRSTUVWXYZ23456789".chars.freeze
  CODE_LENGTH = 8

  belongs_to :created_by, class_name: "User"
  belongs_to :used_by, class_name: "User", optional: true

  normalizes :note, with: ->(note) { note.strip.presence }
  normalizes :code, with: ->(code) { code.to_s.strip.upcase.delete("-") }

  validates :code, presence: true, uniqueness: true
  validates :note, length: { maximum: 100 }

  before_validation { self.code ||= Invite.generate_code }

  scope :unused, -> { where(used_at: nil) }

  def self.generate_code
    Array.new(CODE_LENGTH) { ALPHABET.sample(random: SecureRandom) }.join
  end

  # "ABCD-EFGH", easier to read than one long string.
  def display_code
    code.scan(/.{1,4}/).join("-")
  end

  def used? = used_at.present?
end
