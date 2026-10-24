import { bootstrapTimeline } from './app/bootstrap';
import { createTimelineRouter } from './router';
import { showBootstrapFailure } from './bootstrapFailure';

void bootstrapTimeline(createTimelineRouter()).catch(showBootstrapFailure);
