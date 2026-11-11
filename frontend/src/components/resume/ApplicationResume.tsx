import { useState } from 'react';
import { useMutation, useQuery } from '@apollo/client';
import { Link, useNavigate } from 'react-router';
import type { JobApplicationQuery } from '../../gql/graphql';
import { ResumesQuery, TailorResumeMutation } from '../../graphql/operations';
import { downloadResumePdf } from '../../lib/resume/download';
import { showTailoredToast } from '../../lib/resume/newResumeToast';
import { pdfFileName, toResumeContent } from '../../lib/resume/types';
import { DownloadIcon, FileTextIcon, PencilIcon, SparklesIcon } from '../icons';
import { Button, ButtonLink, Card, ErrorBanner, Select } from '../ui';

type Application = Pick<JobApplicationQuery['jobApplication'], 'id' | 'company' | 'role' | 'resume'>;

/**
 * The Resume section on an application's page: the resume tailored for this
 * job, or a way to make one from a base resume.
 */
export default function ApplicationResume({ application }: { application: Application }) {
  return (
    <section className="mb-6" aria-labelledby="resume-heading">
      <h2 id="resume-heading" className="mb-3 text-xl font-black">
        Resume
      </h2>
      {application.resume ? (
        <LinkedResume application={application} resume={application.resume} />
      ) : (
        <TailorOne application={application} />
      )}
    </section>
  );
}

function LinkedResume({ application, resume }: { application: Application; resume: NonNullable<Application['resume']> }) {
  const [working, setWorking] = useState(false);
  const [problem, setProblem] = useState<string | null>(null);
  const fileName = pdfFileName(toResumeContent(resume.content), resume.title, application);

  async function download() {
    setWorking(true);
    setProblem(null);
    try {
      await downloadResumePdf(resume, application);
    } catch {
      setProblem("We couldn't make the PDF. Open the resume and try from there.");
    } finally {
      setWorking(false);
    }
  }

  return (
    <Card className="p-4">
      <div className="flex flex-wrap items-center gap-3">
        <span className="flex size-11 shrink-0 items-center justify-center rounded-xl bg-brand-100 text-xl text-brand-600 dark:bg-brand-900/50 dark:text-brand-300">
          <FileTextIcon />
        </span>
        <div className="min-w-0 flex-1">
          <p className="truncate font-extrabold">{resume.title}</p>
          <p className="text-sm break-words text-stone-500 dark:text-stone-400">Downloads as {fileName}</p>
        </div>
        <ButtonLink variant="secondary" to={`/resumes/${resume.id}`}>
          <PencilIcon /> Open
        </ButtonLink>
        <Button variant="secondary" onClick={download} disabled={working}>
          <DownloadIcon /> {working ? 'Making PDF…' : 'Download PDF'}
        </Button>
      </div>
      {problem && (
        <div className="mt-3">
          <ErrorBanner messages={[problem]} />
        </div>
      )}
    </Card>
  );
}

function TailorOne({ application }: { application: Application }) {
  const navigate = useNavigate();
  const { data, loading } = useQuery(ResumesQuery);
  const [tailorResume, { loading: tailoring }] = useMutation(TailorResumeMutation, {
    refetchQueries: ['Board', 'Resumes', 'JobApplication', 'JobApplications'],
  });
  const [chosen, setChosen] = useState('');
  const [problem, setProblem] = useState<string | null>(null);

  // Start from a base resume, not one already shaped for a different job.
  const bases = (data?.resumes ?? []).filter((resume) => !resume.jobApplication);
  const baseId = chosen || bases[0]?.id || '';
  const pasteLink = `/resumes/new?application=${application.id}`;

  async function tailor() {
    const base = bases.find((resume) => resume.id === baseId);
    if (!base) return;
    setProblem(null);
    try {
      const result = (await tailorResume({ variables: { id: base.id, jobApplicationId: application.id } })).data?.tailorResume;
      if (result?.resume) {
        navigate(`/resumes/${result.resume.id}`);
        showTailoredToast(application, base.title);
      } else {
        setProblem(result?.errors.map((error) => error.message).join(' ') || 'Something went wrong. Try again.');
      }
    } catch (caught) {
      setProblem(caught instanceof Error ? caught.message : 'Something went wrong. Try again.');
    }
  }

  if (loading && !data) return null;

  if (bases.length === 0) {
    return (
      <Card className="flex flex-wrap items-center gap-3 p-4">
        <p className="min-w-0 flex-1 text-stone-600 dark:text-stone-300">
          No resume for this one yet. Make one, and it stays with this application.
        </p>
        <ButtonLink variant="secondary" to={pasteLink}>
          <SparklesIcon /> New resume
        </ButtonLink>
      </Card>
    );
  }

  return (
    <Card className="space-y-3 p-4">
      <p className="text-stone-600 dark:text-stone-300">
        Copy one of your base resumes and shape it for {application.company}. The copy stays with this application.
      </p>
      <div className="flex flex-wrap items-center gap-3">
        <label htmlFor="tailor-base" className="sr-only">
          Base resume to start from
        </label>
        <Select id="tailor-base" value={baseId} onChange={(e) => setChosen(e.target.value)} className="min-w-0 flex-1 basis-48">
          {bases.map((resume) => (
            <option key={resume.id} value={resume.id}>
              {resume.title}
            </option>
          ))}
        </Select>
        <Button onClick={tailor} disabled={tailoring}>
          <SparklesIcon /> {tailoring ? 'Copying…' : 'Tailor a resume'}
        </Button>
      </div>
      <p className="text-sm text-stone-500 dark:text-stone-400">
        Already had an AI tailor it?{' '}
        <Link to={pasteLink} className="font-bold text-brand-600 hover:underline dark:text-brand-300">
          Paste it in instead
        </Link>
      </p>
      {problem && <ErrorBanner messages={[problem]} />}
    </Card>
  );
}
