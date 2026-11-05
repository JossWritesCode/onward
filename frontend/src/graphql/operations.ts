import { graphql } from '../gql';

// Every query and mutation the app sends lives here. `npm run codegen` reads
// these and generates matching TypeScript types into src/gql/.

export const MeQuery = graphql(`
  query Me {
    me {
      id
      emailAddress
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
