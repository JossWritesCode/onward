import { graphql } from '../gql';

// Every query and mutation the app sends lives here. `npm run codegen` reads
// these and generates matching TypeScript types into src/gql/.

export const MeQuery = graphql(`
  query Me {
    me {
      id
      emailAddress
      timeZone
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
  mutation SignUp($emailAddress: String!, $password: String!, $passwordConfirmation: String!) {
    signUp(emailAddress: $emailAddress, password: $password, passwordConfirmation: $passwordConfirmation) {
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
      }
    }
  }
`);

export const LogActivityMutation = graphql(`
  mutation LogActivity($kind: ActivityKind!, $jobApplicationId: ID, $contactId: ID, $note: String) {
    logActivity(kind: $kind, jobApplicationId: $jobApplicationId, contactId: $contactId, note: $note) {
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
