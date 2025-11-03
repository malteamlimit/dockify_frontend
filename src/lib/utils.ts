import {clsx, type ClassValue} from "clsx"
import {twMerge} from "tailwind-merge"
import {DockingJob} from "@/app/models";
import {toast} from "sonner";


// ---------------------- Serialisation ----------------------
export function cn(...inputs: ClassValue[]) {
  return twMerge(clsx(inputs))
}


// ---------------------- Time and Date Utils ----------------------

const MONTH_NAMES = [
  'Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun',
  'Jul', 'Aug', 'Sep', 'Oct', 'Nov', 'Dec'
];

function getFormattedDate(date: Date, prefomattedDate: string | boolean = false, hideYear = false) {
  const day = date.getDate();
  const month = MONTH_NAMES[date.getMonth()];
  const year = date.getFullYear();
  const hours = date.getHours();
  let minutes: number | string = date.getMinutes();

  if (minutes < 10) {
    // Adding leading zero to minutes
    minutes = `0${ minutes }`;
  }

  if (prefomattedDate) {
    // Today at 10:20
    // Yesterday at 10:20
    return `${ prefomattedDate } at ${ hours }:${ minutes }`;
  }

  if (hideYear) {
    // 10. January at 10:20
    return `${ day }. ${ month } at ${ hours }:${ minutes }`;
  }

  // 10. January 2017. at 10:20
  return `${ day }. ${ month } ${ year }. at ${ hours }:${ minutes }`;
}


export function timeAgo(dateParam: string | number | Date) {
  if (!dateParam) {
    return null;
  }

  const date = typeof dateParam === 'object' ? dateParam : new Date(dateParam);
  const DAY_IN_MS = 86400000; // 24 * 60 * 60 * 1000
  const today = new Date();
  // @ts-expect-error THERE IS NO ERROR EXPECTED
  const yesterday = new Date(today - DAY_IN_MS);
  // @ts-expect-error THERE IS NO ERROR EXPECTED
  const seconds = Math.round((today - date) / 1000);
  const minutes = Math.round(seconds / 60);
  const isToday = today.toDateString() === date.toDateString();
  const isYesterday = yesterday.toDateString() === date.toDateString();
  const isThisYear = today.getFullYear() === date.getFullYear();


  if (seconds < 5) {
    return 'now';
  } else if (seconds < 60) {
    return `${ seconds } seconds ago`;
  } else if (seconds < 90) {
    return 'about a minute ago';
  } else if (minutes < 60) {
    return `${ minutes } minutes ago`;
  } else if (isToday) {
    return getFormattedDate(date, 'Today'); // Today at 10:20
  } else if (isYesterday) {
    return getFormattedDate(date, 'Yesterday'); // Yesterday at 10:20
  } else if (isThisYear) {
    return getFormattedDate(date, false, true); // 10. January at 10:20
  }

  return getFormattedDate(date); // 10. January 2017. at 10:20
}



// ---------------------- Colors ----------------------
export function perc2color(perc: number, min: number, max: number) {
  const base = (max - min);

  if (base == 0) {
    perc = 100;
  } else {
      perc = (perc - min) / base * 100;
  }
  const d = 0.6
  let r, g, b = 0;
  if (perc < 50) {
      r = Math.round(255);
      g = Math.round(5.1 * perc);
  } else {
      g = Math.round(255);
      r = Math.round(510 - 5.10 * perc);
  }
  r = Math.round(r*d);
  g = Math.round(g*d);
  b = Math.round(b*d);
  const h = r * 0x10000 + g * 0x100 + b * 0x1;
  return '#' + ('000000' + h.toString(16)).slice(-6);
}



// ---------------------- Downloads ----------------------
/**
 * Handles the download of a PDB file for a given docking job and pose index.
 * If the index is 'best', it downloads the best pose. Otherwise, it downloads
 * the pose corresponding to the provided index.
 *
 * @param job - The docking job containing the poses.
 * @param index - The index of the pose to download or 'best' for the best
 * pose.
 * @returns A promise that resolves when the download is initiated.
 * @example
 * // Download the best pose
 * handlePDBDownload(job, 'best');
 * // Download the pose at index 2
 * handlePDBDownload(job, 2);
 *
 **/
export async function handlePDBDownload(job: DockingJob, index: number | 'best')  {

  if (index === 'best') {
    if (job.best_complex_nr === null) {
      toast.error("No best pose available for download.");
      return;
    }
    index = job.best_complex_nr;
  } else if (index < 0 || index >= job.runs) {
    toast.error("Invalid pose index for download.");
    return;
  }

  const downloadName = index === job.best_complex_nr
    ? `${job.name}_best_pose.pdb`
    : `${job.name}_pose_${index + 1}.pdb`;

  const url = `${process.env.NEXT_PUBLIC_API_URL}/static/poses/${job.job_id}_${index}.pdb`;
  const response = await fetch(url);
  const blob = await response.blob();

  downloadBlob(blob, downloadName);
}

export function downloadBlob(blob: Blob, downloadName: string) {
  const link = document.createElement('a');
  link.href = URL.createObjectURL(blob);
  link.download = downloadName;
  document.body.appendChild(link);
  link.click();
  document.body.removeChild(link);
  URL.revokeObjectURL(link.href);
}
