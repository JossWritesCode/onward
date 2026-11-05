# A signed-in browser. Each sign-in creates one, and signing out deletes it,
# so a stolen cookie stops working as soon as its session is gone.
class Session < ApplicationRecord
  belongs_to :user
end
