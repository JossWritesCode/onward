import { graphql } from '../gql';

// Every query and mutation the app sends lives here. `npm run codegen` reads
// these and generates matching TypeScript types into src/gql/.

export const MeQuery = graphql(`
  query Me {
    me {
      id
      emailAddress
      timeZone
      engineeringTrack
      admin
    }
  }
`);

export const SignInMutation = graphql(`
  mutation SignIn($emailAddress: String!, $password: String!) {
    signIn(emailAddress: $emailAddress, password: $password) {
      user {
        id
      }
      errors {
        field
        message
      }
    }
  }
`);

export const SignUpMutation = graphql(`
  mutation SignUp($emailAddress: String!, $password: String!, $passwordConfirmation: String!, $inviteCode: String) {
    signUp(
      emailAddress: $emailAddress
      password: $password
      passwordConfirmation: $passwordConfirmation
      inviteCode: $inviteCode
    ) {
      user {
        id
      }
      errors {
        field
        message
      }
    }
  }
`);

export const SignOutMutation = graphql(`
  mutation SignOut {
    signOut {
      success
    }
  }
`);

// The board: every column with its cards, left to right and top to bottom.
// The list view uses this too.
export const BoardQuery = graphql(`
  query Board {
    stages {
      id
      name
      kind
      position
      jobApplications {
        id
        company
        role
        status
        dateApplied
        location
        workArrangement
        position
        updatedAt
        nextInterviewAt
        contacts {
          id
          name
        }
      }
    }
  }
`);

export const StagesQuery = graphql(`
  query Stages {
    stages {
      id
      name
      kind
      position
    }
  }
`);

export const MoveJobApplicationMutation = graphql(`
  mutation MoveJobApplication($id: ID!, $stageId: ID!, $position: Int) {
    moveJobApplication(id: $id, stageId: $stageId, position: $position) {
      jobApplication {
        id
        status
        position
        dateApplied
        stage {
          id
        }
      }
      errors {
        field
        message
      }
    }
  }
`);

export const CreateStageMutation = graphql(`
  mutation CreateStage($input: StageInput!) {
    createStage(input: $input) {
      stage {
        id
        name
        kind
        position
      }
      errors {
        field
        message
      }
    }
  }
`);

export const UpdateStageMutation = graphql(`
  mutation UpdateStage($id: ID!, $input: StageInput!) {
    updateStage(id: $id, input: $input) {
      stage {
        id
        name
        kind
        position
      }
      errors {
        field
        message
      }
    }
  }
`);

export const DeleteStageMutation = graphql(`
  mutation DeleteStage($id: ID!) {
    deleteStage(id: $id) {
      id
      errors {
        field
        message
      }
    }
  }
`);

export const ReorderStagesMutation = graphql(`
  mutation ReorderStages($ids: [ID!]!) {
    reorderStages(ids: $ids) {
      stages {
        id
        position
      }
    }
  }
`);

export const JobApplicationsQuery = graphql(`
  query JobApplications {
    jobApplications {
      id
      company
      role
      status
      dateApplied
      location
      workArrangement
      updatedAt
      contacts {
        id
        name
      }
    }
  }
`);

export const JobApplicationQuery = graphql(`
  query JobApplication($id: ID!) {
    jobApplication(id: $id) {
      id
      company
      role
      status
      dateApplied
      postingUrl
      salaryRange
      location
      workArrangement
      jobDescription
      resumeVersion
      notes
      createdAt
      updatedAt
      stage {
        id
        kind
        position
      }
      contacts {
        id
        name
      }
      interviewRounds {
        id
        name
        scheduledAt
        prepped
        checklistItems {
          id
          text
          done
        }
      }
    }
  }
`);

export const CreateJobApplicationMutation = graphql(`
  mutation CreateJobApplication($input: JobApplicationInput!) {
    createJobApplication(input: $input) {
      jobApplication {
        id
        stage {
          id
          kind
        }
      }
      errors {
        field
        message
      }
    }
  }
`);

export const UpdateJobApplicationMutation = graphql(`
  mutation UpdateJobApplication($id: ID!, $input: JobApplicationInput!) {
    updateJobApplication(id: $id, input: $input) {
      jobApplication {
        id
        company
        role
        status
        dateApplied
        postingUrl
        salaryRange
        location
        workArrangement
        jobDescription
        resumeVersion
        notes
        updatedAt
        stage {
          id
          kind
          position
        }
        contacts {
          id
          name
        }
      }
      errors {
        field
        message
      }
    }
  }
`);

export const DeleteJobApplicationMutation = graphql(`
  mutation DeleteJobApplication($id: ID!) {
    deleteJobApplication(id: $id) {
      id
    }
  }
`);

export const ContactsQuery = graphql(`
  query Contacts {
    contacts {
      id
      name
      title
      company
      email
      lastContactedOn
      jobApplications {
        id
        company
      }
    }
  }
`);

export const ContactQuery = graphql(`
  query Contact($id: ID!) {
    contact(id: $id) {
      id
      name
      title
      company
      email
      phone
      linkedinUrl
      lastContactedOn
      notes
      jobApplications {
        id
        company
        role
      }
    }
  }
`);

export const CreateContactMutation = graphql(`
  mutation CreateContact($input: ContactInput!) {
    createContact(input: $input) {
      contact {
        id
        name
      }
      errors {
        field
        message
      }
    }
  }
`);

export const UpdateContactMutation = graphql(`
  mutation UpdateContact($id: ID!, $input: ContactInput!) {
    updateContact(id: $id, input: $input) {
      contact {
        id
        name
        title
        company
        email
        phone
        linkedinUrl
        lastContactedOn
        notes
        jobApplications {
          id
          company
          role
        }
      }
      errors {
        field
        message
      }
    }
  }
`);

export const DeleteContactMutation = graphql(`
  mutation DeleteContact($id: ID!) {
    deleteContact(id: $id) {
      id
    }
  }
`);

export const UpdateTimeZoneMutation = graphql(`
  mutation UpdateTimeZone($timeZone: String!) {
    updateTimeZone(timeZone: $timeZone) {
      user {
        id
        timeZone
      }
      errors {
        field
        message
      }
    }
  }
`);

// Small and cheap, for the flame in the header on every page.
export const StreakQuery = graphql(`
  query Streak {
    progress {
      today
      streak {
        current
        activeToday
        freezes
      }
      perfectDay {
        today
        streak
      }
    }
  }
`);

export const ProgressQuery = graphql(`
  query Progress($since: ISO8601Date!) {
    progress {
      today
      streak {
        current
        longest
        freezes
        activeToday
        frozenDates
      }
      perfectDay {
        today
        streak
        hasGoals
      }
      perfectDays(since: $since)
      activities(since: $since) {
        id
        kind
        category
        occurredOn
        note
        automatic
        createdAt
        jobApplication {
          id
          company
          role
        }
        contact {
          id
          name
        }
        customAction {
          id
          name
        }
      }
    }
  }
`);

export const LogActivityMutation = graphql(`
  mutation LogActivity($kind: ActivityKind!, $jobApplicationId: ID, $contactId: ID, $customActionId: ID, $note: String) {
    logActivity(
      kind: $kind
      jobApplicationId: $jobApplicationId
      contactId: $contactId
      customActionId: $customActionId
      note: $note
    ) {
      activity {
        id
      }
      errors {
        field
        message
      }
    }
  }
`);

export const DeleteActivityMutation = graphql(`
  mutation DeleteActivity($id: ID!) {
    deleteActivity(id: $id) {
      id
      errors {
        field
        message
      }
    }
  }
`);

// Interview prep

export const PrepQuery = graphql(`
  query Prep {
    upcomingInterviewRounds {
      id
      name
      scheduledAt
      prepped
      checklistItems {
        id
        text
        done
      }
      jobApplication {
        id
        company
        role
      }
    }
    stories {
      id
      title
      situation
      task
      action
      result
      tags
      practiceCount
      lastPracticedOn
      lastRating
    }
    questions {
      id
      prompt
    }
    studyTopics
  }
`);

export const StoryQuery = graphql(`
  query Story($id: ID!) {
    story(id: $id) {
      id
      title
      situation
      task
      action
      result
      tags
      practiceCount
      lastPracticedOn
      lastRating
    }
  }
`);

export const CreateStoryMutation = graphql(`
  mutation CreateStory($input: StoryInput!) {
    createStory(input: $input) {
      story {
        id
      }
      errors {
        field
        message
      }
    }
  }
`);

export const UpdateStoryMutation = graphql(`
  mutation UpdateStory($id: ID!, $input: StoryInput!) {
    updateStory(id: $id, input: $input) {
      story {
        id
        title
        situation
        task
        action
        result
        tags
      }
      errors {
        field
        message
      }
    }
  }
`);

export const DeleteStoryMutation = graphql(`
  mutation DeleteStory($id: ID!) {
    deleteStory(id: $id) {
      id
    }
  }
`);

export const LogPracticeMutation = graphql(`
  mutation LogPractice($questionId: ID, $storyId: ID, $rating: PracticeRating!, $seconds: Int) {
    logPractice(questionId: $questionId, storyId: $storyId, rating: $rating, seconds: $seconds) {
      story {
        id
        practiceCount
        lastPracticedOn
        lastRating
      }
      errors {
        field
        message
      }
    }
  }
`);

export const PrepSettingsQuery = graphql(`
  query PrepSettings {
    questions {
      id
      prompt
    }
    checklistTemplate {
      id
      text
    }
  }
`);

export const CreateQuestionMutation = graphql(`
  mutation CreateQuestion($prompt: String!) {
    createQuestion(prompt: $prompt) {
      question {
        id
        prompt
      }
      errors {
        field
        message
      }
    }
  }
`);

export const UpdateQuestionMutation = graphql(`
  mutation UpdateQuestion($id: ID!, $prompt: String!) {
    updateQuestion(id: $id, prompt: $prompt) {
      question {
        id
        prompt
      }
      errors {
        field
        message
      }
    }
  }
`);

export const DeleteQuestionMutation = graphql(`
  mutation DeleteQuestion($id: ID!) {
    deleteQuestion(id: $id) {
      id
    }
  }
`);

export const UpdateChecklistTemplateMutation = graphql(`
  mutation UpdateChecklistTemplate($items: [String!]!) {
    updateChecklistTemplate(items: $items) {
      items {
        id
        text
      }
      errors {
        field
        message
      }
    }
  }
`);

export const UpdateInterviewRoundMutation = graphql(`
  mutation UpdateInterviewRound($id: ID!, $scheduledAt: ISO8601DateTime) {
    updateInterviewRound(id: $id, scheduledAt: $scheduledAt) {
      interviewRound {
        id
        scheduledAt
      }
      errors {
        field
        message
      }
    }
  }
`);

export const SetChecklistItemDoneMutation = graphql(`
  mutation SetChecklistItemDone($id: ID!, $done: Boolean!) {
    setChecklistItemDone(id: $id, done: $done) {
      justPrepped
      interviewRound {
        id
        prepped
        checklistItems {
          id
          text
          done
        }
      }
    }
  }
`);

export const AddChecklistItemMutation = graphql(`
  mutation AddChecklistItem($interviewRoundId: ID!, $text: String!) {
    addChecklistItem(interviewRoundId: $interviewRoundId, text: $text) {
      interviewRound {
        id
        prepped
        checklistItems {
          id
          text
          done
        }
      }
      errors {
        field
        message
      }
    }
  }
`);

export const DeleteChecklistItemMutation = graphql(`
  mutation DeleteChecklistItem($id: ID!) {
    deleteChecklistItem(id: $id) {
      interviewRound {
        id
        prepped
        checklistItems {
          id
          text
          done
        }
      }
    }
  }
`);

export const LogStudySessionMutation = graphql(`
  mutation LogStudySession($topic: String!, $minutes: Int!, $studiedOn: ISO8601Date) {
    logStudySession(topic: $topic, minutes: $minutes, studiedOn: $studiedOn) {
      counted
      errors {
        field
        message
      }
    }
  }
`);

// Software engineering track

export const EngineeringSettingsQuery = graphql(`
  query EngineeringSettings {
    me {
      id
      engineeringTrack
      leetcodeUsername
      githubUsername
      githubConnected
    }
  }
`);

export const UpdateEngineeringSettingsMutation = graphql(`
  mutation UpdateEngineeringSettings(
    $engineeringTrack: Boolean
    $leetcodeUsername: String
    $githubUsername: String
    $githubToken: String
  ) {
    updateEngineeringSettings(
      engineeringTrack: $engineeringTrack
      leetcodeUsername: $leetcodeUsername
      githubUsername: $githubUsername
      githubToken: $githubToken
    ) {
      user {
        id
        engineeringTrack
        leetcodeUsername
        githubUsername
        githubConnected
      }
      errors {
        field
        message
      }
    }
  }
`);

export const EngineeringQuery = graphql(`
  query Engineering {
    me {
      id
      engineeringTrack
    }
    engineering {
      leetcode {
        username
        streak
        totalActiveDays
        easySolved
        mediumSolved
        hardSolved
        easyTotal
        mediumTotal
        hardTotal
        days {
          date
          count
        }
        error
        fetchedAt
      }
      github {
        username
        totalContributions
        days {
          date
          count
        }
        error
        fetchedAt
      }
      study {
        minutesThisWeek
        minutesThisMonth
        minutesTotal
        byTopic {
          topic
          minutes
        }
        weeks {
          weekStart
          minutes
        }
      }
    }
    studyTopics
  }
`);

export const RefreshIntegrationsMutation = graphql(`
  mutation RefreshIntegrations {
    refreshIntegrations {
      engineering {
        leetcode {
          username
          streak
          totalActiveDays
          easySolved
          mediumSolved
          hardSolved
          easyTotal
          mediumTotal
          hardTotal
          days {
            date
            count
          }
          error
          fetchedAt
        }
        github {
          username
          totalContributions
          days {
            date
            count
          }
          error
          fetchedAt
        }
      }
    }
  }
`);

// Daily goals, custom actions, and nudges

export const TodayQuery = graphql(`
  query Today {
    today {
      date
      hasGoals
      restDay
      perfect
      perfectStreak
      goals {
        count
        done
        goal {
          id
          kind
          target
          weekdaysOnly
          customAction {
            id
            name
          }
        }
      }
      nudges {
        key
        kind
        since
        jobApplication {
          id
          company
          role
        }
        contact {
          id
          name
          lastContactedOn
        }
        interviewRound {
          id
          name
          scheduledAt
          checklistItems {
            id
            done
          }
          jobApplication {
            id
            company
          }
        }
      }
    }
  }
`);

export const DailyGoalsQuery = graphql(`
  query DailyGoals {
    me {
      id
      engineeringTrack
    }
    dailyGoals {
      id
      kind
      target
      minTarget
      maxTarget
      weekdaysOnly
      available
      customAction {
        id
        name
      }
    }
    customActions {
      id
      name
      category
    }
  }
`);

export const CustomActionsQuery = graphql(`
  query CustomActions {
    customActions {
      id
      name
      category
    }
  }
`);

export const CreateDailyGoalMutation = graphql(`
  mutation CreateDailyGoal($kind: DailyGoalKind!, $target: Int!, $weekdaysOnly: Boolean, $customActionId: ID) {
    createDailyGoal(kind: $kind, target: $target, weekdaysOnly: $weekdaysOnly, customActionId: $customActionId) {
      dailyGoal {
        id
      }
      errors {
        field
        message
      }
    }
  }
`);

export const UpdateDailyGoalMutation = graphql(`
  mutation UpdateDailyGoal($id: ID!, $target: Int, $weekdaysOnly: Boolean) {
    updateDailyGoal(id: $id, target: $target, weekdaysOnly: $weekdaysOnly) {
      dailyGoal {
        id
        target
        weekdaysOnly
      }
      errors {
        field
        message
      }
    }
  }
`);

export const DeleteDailyGoalMutation = graphql(`
  mutation DeleteDailyGoal($id: ID!) {
    deleteDailyGoal(id: $id) {
      id
    }
  }
`);

export const ReorderDailyGoalsMutation = graphql(`
  mutation ReorderDailyGoals($ids: [ID!]!) {
    reorderDailyGoals(ids: $ids) {
      dailyGoals {
        id
      }
    }
  }
`);

export const CreateCustomActionMutation = graphql(`
  mutation CreateCustomAction($name: String!, $category: ActivityCategory!) {
    createCustomAction(name: $name, category: $category) {
      customAction {
        id
        name
        category
      }
      errors {
        field
        message
      }
    }
  }
`);

export const UpdateCustomActionMutation = graphql(`
  mutation UpdateCustomAction($id: ID!, $name: String, $category: ActivityCategory) {
    updateCustomAction(id: $id, name: $name, category: $category) {
      customAction {
        id
        name
        category
      }
      errors {
        field
        message
      }
    }
  }
`);

export const DeleteCustomActionMutation = graphql(`
  mutation DeleteCustomAction($id: ID!) {
    deleteCustomAction(id: $id) {
      id
    }
  }
`);

export const DismissNudgeMutation = graphql(`
  mutation DismissNudge($key: String!, $snooze: Boolean) {
    dismissNudge(key: $key, snooze: $snooze) {
      key
    }
  }
`);

// Accounts: invites, password reset, export, and deleting an account

export const ServerSettingsQuery = graphql(`
  query ServerSettings {
    serverSettings {
      signups
      passwordResetAvailable
    }
  }
`);

export const RequestPasswordResetMutation = graphql(`
  mutation RequestPasswordReset($emailAddress: String!) {
    requestPasswordReset(emailAddress: $emailAddress) {
      sent
      errors {
        field
        message
      }
    }
  }
`);

export const ResetPasswordMutation = graphql(`
  mutation ResetPassword($token: String!, $password: String!, $passwordConfirmation: String!) {
    resetPassword(token: $token, password: $password, passwordConfirmation: $passwordConfirmation) {
      user {
        id
      }
      errors {
        field
        message
      }
    }
  }
`);

export const InvitesQuery = graphql(`
  query Invites {
    invites {
      id
      code
      note
      usedAt
      usedByEmail
      createdAt
    }
  }
`);

export const CreateInviteMutation = graphql(`
  mutation CreateInvite($note: String) {
    createInvite(note: $note) {
      invite {
        id
        code
      }
      errors {
        field
        message
      }
    }
  }
`);

export const DeleteInviteMutation = graphql(`
  mutation DeleteInvite($id: ID!) {
    deleteInvite(id: $id) {
      id
    }
  }
`);

export const DeleteAccountMutation = graphql(`
  mutation DeleteAccount($password: String!) {
    deleteAccount(password: $password) {
      deleted
      errors {
        field
        message
      }
    }
  }
`);

// The "Save to Onward" bookmark checks these to spot a job you've already saved.
export const PostingUrlsQuery = graphql(`
  query PostingUrls {
    jobApplications {
      id
      company
      role
      postingUrl
    }
  }
`);
