import 'package:flutter/material.dart';
import 'package:inbox_companion/core/theme/tokens/radius_tokens.dart';
import 'package:inbox_companion/core/theme/tokens/spacing_tokens.dart';

/// Shimmer loader placeholder component for loading states.
class AppSkeleton extends StatefulWidget {
  const AppSkeleton({
    super.key,
    this.width,
    this.height = 16,
    this.borderRadius = AppRadius.borderSm,
    this.shape = BoxShape.rectangle,
  });

  final double? width;
  final double height;
  final BorderRadiusGeometry borderRadius;
  final BoxShape shape;

  const AppSkeleton.circle({super.key, required double size})
    : width = size,
      height = size,
      borderRadius = BorderRadius.zero,
      shape = BoxShape.circle;

  const AppSkeleton.line({super.key, this.width, this.height = 14})
    : borderRadius = AppRadius.borderXs,
      shape = BoxShape.rectangle;

  @override
  State<AppSkeleton> createState() => _AppSkeletonState();
}

class _AppSkeletonState extends State<AppSkeleton>
    with SingleTickerProviderStateMixin {
  late final AnimationController _controller;
  late final Animation<double> _animation;

  @override
  void initState() {
    super.initState();
    _controller = AnimationController(
      vsync: this,
      duration: const Duration(milliseconds: 1400),
    )..repeat();

    _animation = Tween<double>(begin: -1.0, end: 2.0).animate(
      CurvedAnimation(parent: _controller, curve: Curves.easeInOutSine),
    );
  }

  @override
  void dispose() {
    _controller.dispose();
    super.dispose();
  }

  @override
  Widget build(BuildContext context) {
    final theme = Theme.of(context);
    final isDark = theme.colorScheme.brightness == Brightness.dark;
    final baseColor = isDark
        ? theme.colorScheme.surfaceContainerHighest
        : theme.colorScheme.surfaceContainerHighest.withValues(alpha: 0.8);
    final highlightColor = isDark
        ? theme.colorScheme.surfaceContainerHighest.withValues(alpha: 0.5)
        : Colors.white.withValues(alpha: 0.9);

    final disableAnimations = MediaQuery.of(context).disableAnimations;

    if (disableAnimations) {
      return Container(
        width: widget.width,
        height: widget.height,
        decoration: BoxDecoration(
          color: baseColor,
          shape: widget.shape,
          borderRadius: widget.shape == BoxShape.rectangle
              ? widget.borderRadius
              : null,
        ),
      );
    }

    return AnimatedBuilder(
      animation: _animation,
      builder: (context, child) {
        return Container(
          width: widget.width,
          height: widget.height,
          decoration: BoxDecoration(
            shape: widget.shape,
            borderRadius: widget.shape == BoxShape.rectangle
                ? widget.borderRadius
                : null,
            gradient: LinearGradient(
              begin: Alignment.centerLeft,
              end: Alignment.centerRight,
              stops: const [0.1, 0.5, 0.9],
              colors: [baseColor, highlightColor, baseColor],
              transform: _SlidingGradientTransform(
                slidePercent: _animation.value,
              ),
            ),
          ),
        );
      },
    );
  }
}

class _SlidingGradientTransform extends GradientTransform {
  const _SlidingGradientTransform({required this.slidePercent});

  final double slidePercent;

  @override
  Matrix4? transform(Rect bounds, {TextDirection? textDirection}) {
    return Matrix4.translationValues(bounds.width * slidePercent, 0.0, 0.0);
  }
}

/// Composite Skeleton mimicking an AppThreadTile
class AppSkeletonThreadTile extends StatelessWidget {
  const AppSkeletonThreadTile({super.key});

  @override
  Widget build(BuildContext context) {
    return const Padding(
      padding: EdgeInsets.symmetric(
        horizontal: AppSpacing.lg,
        vertical: AppSpacing.md,
      ),
      child: Row(
        crossAxisAlignment: CrossAxisAlignment.start,
        children: [
          AppSkeleton.circle(size: 40),
          AppSpacing.gapHorizontalMd,
          Expanded(
            child: Column(
              crossAxisAlignment: CrossAxisAlignment.start,
              children: [
                Row(
                  mainAxisAlignment: MainAxisAlignment.spaceBetween,
                  children: [
                    AppSkeleton.line(width: 120, height: 16),
                    AppSkeleton.line(width: 50, height: 12),
                  ],
                ),
                AppSpacing.gapVerticalSm,
                AppSkeleton.line(width: 220, height: 14),
                AppSpacing.gapVerticalXs,
                AppSkeleton.line(width: double.infinity, height: 12),
                AppSpacing.gapVerticalXs,
                AppSkeleton.line(width: 160, height: 12),
              ],
            ),
          ),
        ],
      ),
    );
  }
}
