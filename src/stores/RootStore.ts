import { CommentsStore, PostDetailStore } from '@/widgets/post-detail';
import { ApiClient } from '../shared/api';
import { FeedStore } from './FeedStore';
import { RealtimeService } from '@/features/realtime';



export class RootStore {
  readonly api: ApiClient;
  readonly feed: FeedStore;
  readonly postDetail: PostDetailStore;
  readonly comments: CommentsStore;
  readonly realtime: RealtimeService;

  private disposers: (() => void)[] = [];

  constructor() {
    this.api = new ApiClient();
    this.feed = new FeedStore(this.api);
    this.postDetail = new PostDetailStore(this.api);
    this.comments = new CommentsStore(this.api);
    this.realtime = new RealtimeService(this.api.getToken());

    this.bindRealtime();
  }

  private bindRealtime() {
    const unsubLike = this.realtime.onLikeUpdated((event) => {
      this.feed.updatePostLikes(event.postId, event.likesCount);
      if (this.postDetail.post?.id === event.postId) {
        this.postDetail.updateLikes(event.likesCount);
      }
    });

    const unsubComment = this.realtime.onCommentAdded((event) => {
      this.comments.addRealtimeComment(event.comment);
      if (this.postDetail.post?.id === event.postId) {
        this.postDetail.updateCommentsCount(1);
      }
    });

    this.disposers.push(unsubLike, unsubComment);
  }

  init() {
    this.realtime.connect();
    this.feed.loadPosts();
  }

  dispose() {
    this.disposers.forEach((fn) => fn());
    this.realtime.disconnect();
  }
}
