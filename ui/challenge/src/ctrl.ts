import * as xhr from 'common/xhr';
import { trans } from 'common/trans';
import { once } from 'common/storage';
import { ChallengeOpts, ChallengeData, Reasons } from './interfaces';

export default class ChallengeCtrl {
  data: ChallengeData;
  trans = (key: string) => key;
  redirecting = false;
  reasons: Reasons = {};

  showRatings = !document.body.classList.contains('no-rating');

  constructor(
    readonly opts: ChallengeOpts,
    data: ChallengeData,
    readonly redraw: () => void,
  ) {
    this.update(data);
  }

  update = (d: ChallengeData) => {
    this.data = d;
    if (d.i18n) this.trans = trans(d.i18n).noarg;
    if (d.reasons) this.reasons = d.reasons;
    this.opts.setCount(this.countActiveIn());
    this.notifyNew();
  };

  countActiveIn = () => this.data.in.filter(c => !c.declined).length;

  notifyNew = () =>
    this.data.in.forEach(c => {
      if (once('c-' + c.id)) {
        if (!site.quietMode && this.data.in.length <= 3) {
          this.opts.show();
          site.sound.playOnce('newChallenge');
        }
        this.opts.pulse();
      }
    });

  decline = (id: string, reason: string) =>
    this.data.in.forEach(c => {
      if (c.id === id) {
        c.declined = true;
        xhr
          .text(`/challenge/${id}/decline`, { method: 'post', body: xhr.form({ reason }) })
          .catch(() => site.announce({ msg: 'Failed to send challenge decline' }));
      }
    });
  cancel = (id: string) =>
    this.data.out.forEach(c => {
      if (c.id === id) {
        c.declined = true;
        xhr
          .text(`/challenge/${id}/cancel`, { method: 'post' })
          .catch(() => site.announce({ msg: 'Failed to send challenge cancellation' }));
      }
    });
  onRedirect = () => {
    this.redirecting = true;
    requestAnimationFrame(this.redraw);
  };
}
