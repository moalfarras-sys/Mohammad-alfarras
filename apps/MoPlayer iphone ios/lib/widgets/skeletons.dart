import 'package:flutter/material.dart';

/// A gently pulsing placeholder block used while content loads.
class SkeletonBox extends StatefulWidget {
  const SkeletonBox({super.key, this.width, this.height, this.radius = 12});

  final double? width;
  final double? height;
  final double radius;

  @override
  State<SkeletonBox> createState() => _SkeletonBoxState();
}

class _SkeletonBoxState extends State<SkeletonBox>
    with SingleTickerProviderStateMixin {
  late final AnimationController _controller = AnimationController(
    vsync: this,
    duration: const Duration(milliseconds: 1100),
  )..repeat(reverse: true);

  @override
  void dispose() {
    _controller.dispose();
    super.dispose();
  }

  @override
  Widget build(BuildContext context) {
    return AnimatedBuilder(
      animation: _controller,
      builder: (context, _) {
        final t = 0.04 + (_controller.value * 0.06);
        return Container(
          width: widget.width,
          height: widget.height,
          decoration: BoxDecoration(
            color: Colors.white.withValues(alpha: t),
            borderRadius: BorderRadius.circular(widget.radius),
          ),
        );
      },
    );
  }
}

/// A grid of poster-shaped skeletons.
class PosterGridSkeleton extends StatelessWidget {
  const PosterGridSkeleton({
    super.key,
    this.count = 12,
    this.aspectRatio = 0.66,
  });

  final int count;
  final double aspectRatio;

  @override
  Widget build(BuildContext context) {
    return GridView.builder(
      padding: const EdgeInsets.all(16),
      physics: const NeverScrollableScrollPhysics(),
      gridDelegate: SliverGridDelegateWithMaxCrossAxisExtent(
        maxCrossAxisExtent: 150,
        childAspectRatio: aspectRatio,
        crossAxisSpacing: 12,
        mainAxisSpacing: 12,
      ),
      itemCount: count,
      itemBuilder: (context, index) => const SkeletonBox(radius: 14),
    );
  }
}

/// A vertical list of row-shaped skeletons (channels, episodes).
class ListSkeleton extends StatelessWidget {
  const ListSkeleton({super.key, this.count = 10});

  final int count;

  @override
  Widget build(BuildContext context) {
    return ListView.separated(
      padding: const EdgeInsets.all(12),
      physics: const NeverScrollableScrollPhysics(),
      itemCount: count,
      separatorBuilder: (context, index) => const SizedBox(height: 10),
      itemBuilder: (context, index) => Row(
        children: const [
          SkeletonBox(width: 46, height: 46, radius: 12),
          SizedBox(width: 12),
          Expanded(child: SkeletonBox(height: 16)),
        ],
      ),
    );
  }
}
