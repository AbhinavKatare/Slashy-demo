// GENERATED CODE - DO NOT MODIFY BY HAND
// coverage:ignore-file
// ignore_for_file: type=lint
// ignore_for_file: unused_element, deprecated_member_use, deprecated_member_use_from_same_package, use_function_type_syntax_for_parameters, unnecessary_const, avoid_init_to_null, invalid_override_different_default_values_named, prefer_expression_function_bodies, annotate_overrides, invalid_annotation_target, unnecessary_question_mark

part of 'scheduled_send_model.dart';

// **************************************************************************
// FreezedGenerator
// **************************************************************************

// dart format off
T _$identity<T>(T value) => value;

/// @nodoc
mixin _$ScheduledSendModel {

 String get id; String get threadId; String get scheduledFor; String get status;
/// Create a copy of ScheduledSendModel
/// with the given fields replaced by the non-null parameter values.
@JsonKey(includeFromJson: false, includeToJson: false)
@pragma('vm:prefer-inline')
$ScheduledSendModelCopyWith<ScheduledSendModel> get copyWith => _$ScheduledSendModelCopyWithImpl<ScheduledSendModel>(this as ScheduledSendModel, _$identity);

  /// Serializes this ScheduledSendModel to a JSON map.
  Map<String, dynamic> toJson();


@override
bool operator ==(Object other) {
  return identical(this, other) || (other.runtimeType == runtimeType&&other is ScheduledSendModel&&(identical(other.id, id) || other.id == id)&&(identical(other.threadId, threadId) || other.threadId == threadId)&&(identical(other.scheduledFor, scheduledFor) || other.scheduledFor == scheduledFor)&&(identical(other.status, status) || other.status == status));
}

@JsonKey(includeFromJson: false, includeToJson: false)
@override
int get hashCode => Object.hash(runtimeType,id,threadId,scheduledFor,status);

@override
String toString() {
  return 'ScheduledSendModel(id: $id, threadId: $threadId, scheduledFor: $scheduledFor, status: $status)';
}


}

/// @nodoc
abstract mixin class $ScheduledSendModelCopyWith<$Res>  {
  factory $ScheduledSendModelCopyWith(ScheduledSendModel value, $Res Function(ScheduledSendModel) _then) = _$ScheduledSendModelCopyWithImpl;
@useResult
$Res call({
 String id, String threadId, String scheduledFor, String status
});




}
/// @nodoc
class _$ScheduledSendModelCopyWithImpl<$Res>
    implements $ScheduledSendModelCopyWith<$Res> {
  _$ScheduledSendModelCopyWithImpl(this._self, this._then);

  final ScheduledSendModel _self;
  final $Res Function(ScheduledSendModel) _then;

/// Create a copy of ScheduledSendModel
/// with the given fields replaced by the non-null parameter values.
@pragma('vm:prefer-inline') @override $Res call({Object? id = null,Object? threadId = null,Object? scheduledFor = null,Object? status = null,}) {
  return _then(_self.copyWith(
id: null == id ? _self.id : id // ignore: cast_nullable_to_non_nullable
as String,threadId: null == threadId ? _self.threadId : threadId // ignore: cast_nullable_to_non_nullable
as String,scheduledFor: null == scheduledFor ? _self.scheduledFor : scheduledFor // ignore: cast_nullable_to_non_nullable
as String,status: null == status ? _self.status : status // ignore: cast_nullable_to_non_nullable
as String,
  ));
}

}


/// Adds pattern-matching-related methods to [ScheduledSendModel].
extension ScheduledSendModelPatterns on ScheduledSendModel {
/// A variant of `map` that fallback to returning `orElse`.
///
/// It is equivalent to doing:
/// ```dart
/// switch (sealedClass) {
///   case final Subclass value:
///     return ...;
///   case _:
///     return orElse();
/// }
/// ```

@optionalTypeArgs TResult maybeMap<TResult extends Object?>(TResult Function( _ScheduledSendModel value)?  $default,{required TResult orElse(),}){
final _that = this;
switch (_that) {
case _ScheduledSendModel() when $default != null:
return $default(_that);case _:
  return orElse();

}
}
/// A `switch`-like method, using callbacks.
///
/// Callbacks receives the raw object, upcasted.
/// It is equivalent to doing:
/// ```dart
/// switch (sealedClass) {
///   case final Subclass value:
///     return ...;
///   case final Subclass2 value:
///     return ...;
/// }
/// ```

@optionalTypeArgs TResult map<TResult extends Object?>(TResult Function( _ScheduledSendModel value)  $default,){
final _that = this;
switch (_that) {
case _ScheduledSendModel():
return $default(_that);case _:
  throw StateError('Unexpected subclass');

}
}
/// A variant of `map` that fallback to returning `null`.
///
/// It is equivalent to doing:
/// ```dart
/// switch (sealedClass) {
///   case final Subclass value:
///     return ...;
///   case _:
///     return null;
/// }
/// ```

@optionalTypeArgs TResult? mapOrNull<TResult extends Object?>(TResult? Function( _ScheduledSendModel value)?  $default,){
final _that = this;
switch (_that) {
case _ScheduledSendModel() when $default != null:
return $default(_that);case _:
  return null;

}
}
/// A variant of `when` that fallback to an `orElse` callback.
///
/// It is equivalent to doing:
/// ```dart
/// switch (sealedClass) {
///   case Subclass(:final field):
///     return ...;
///   case _:
///     return orElse();
/// }
/// ```

@optionalTypeArgs TResult maybeWhen<TResult extends Object?>(TResult Function( String id,  String threadId,  String scheduledFor,  String status)?  $default,{required TResult orElse(),}) {final _that = this;
switch (_that) {
case _ScheduledSendModel() when $default != null:
return $default(_that.id,_that.threadId,_that.scheduledFor,_that.status);case _:
  return orElse();

}
}
/// A `switch`-like method, using callbacks.
///
/// As opposed to `map`, this offers destructuring.
/// It is equivalent to doing:
/// ```dart
/// switch (sealedClass) {
///   case Subclass(:final field):
///     return ...;
///   case Subclass2(:final field2):
///     return ...;
/// }
/// ```

@optionalTypeArgs TResult when<TResult extends Object?>(TResult Function( String id,  String threadId,  String scheduledFor,  String status)  $default,) {final _that = this;
switch (_that) {
case _ScheduledSendModel():
return $default(_that.id,_that.threadId,_that.scheduledFor,_that.status);case _:
  throw StateError('Unexpected subclass');

}
}
/// A variant of `when` that fallback to returning `null`
///
/// It is equivalent to doing:
/// ```dart
/// switch (sealedClass) {
///   case Subclass(:final field):
///     return ...;
///   case _:
///     return null;
/// }
/// ```

@optionalTypeArgs TResult? whenOrNull<TResult extends Object?>(TResult? Function( String id,  String threadId,  String scheduledFor,  String status)?  $default,) {final _that = this;
switch (_that) {
case _ScheduledSendModel() when $default != null:
return $default(_that.id,_that.threadId,_that.scheduledFor,_that.status);case _:
  return null;

}
}

}

/// @nodoc
@JsonSerializable()

class _ScheduledSendModel implements ScheduledSendModel {
  const _ScheduledSendModel({required this.id, required this.threadId, required this.scheduledFor, required this.status});
  factory _ScheduledSendModel.fromJson(Map<String, dynamic> json) => _$ScheduledSendModelFromJson(json);

@override final  String id;
@override final  String threadId;
@override final  String scheduledFor;
@override final  String status;

/// Create a copy of ScheduledSendModel
/// with the given fields replaced by the non-null parameter values.
@override @JsonKey(includeFromJson: false, includeToJson: false)
@pragma('vm:prefer-inline')
_$ScheduledSendModelCopyWith<_ScheduledSendModel> get copyWith => __$ScheduledSendModelCopyWithImpl<_ScheduledSendModel>(this, _$identity);

@override
Map<String, dynamic> toJson() {
  return _$ScheduledSendModelToJson(this, );
}

@override
bool operator ==(Object other) {
  return identical(this, other) || (other.runtimeType == runtimeType&&other is _ScheduledSendModel&&(identical(other.id, id) || other.id == id)&&(identical(other.threadId, threadId) || other.threadId == threadId)&&(identical(other.scheduledFor, scheduledFor) || other.scheduledFor == scheduledFor)&&(identical(other.status, status) || other.status == status));
}

@JsonKey(includeFromJson: false, includeToJson: false)
@override
int get hashCode => Object.hash(runtimeType,id,threadId,scheduledFor,status);

@override
String toString() {
  return 'ScheduledSendModel(id: $id, threadId: $threadId, scheduledFor: $scheduledFor, status: $status)';
}


}

/// @nodoc
abstract mixin class _$ScheduledSendModelCopyWith<$Res> implements $ScheduledSendModelCopyWith<$Res> {
  factory _$ScheduledSendModelCopyWith(_ScheduledSendModel value, $Res Function(_ScheduledSendModel) _then) = __$ScheduledSendModelCopyWithImpl;
@override @useResult
$Res call({
 String id, String threadId, String scheduledFor, String status
});




}
/// @nodoc
class __$ScheduledSendModelCopyWithImpl<$Res>
    implements _$ScheduledSendModelCopyWith<$Res> {
  __$ScheduledSendModelCopyWithImpl(this._self, this._then);

  final _ScheduledSendModel _self;
  final $Res Function(_ScheduledSendModel) _then;

/// Create a copy of ScheduledSendModel
/// with the given fields replaced by the non-null parameter values.
@override @pragma('vm:prefer-inline') $Res call({Object? id = null,Object? threadId = null,Object? scheduledFor = null,Object? status = null,}) {
  return _then(_ScheduledSendModel(
id: null == id ? _self.id : id // ignore: cast_nullable_to_non_nullable
as String,threadId: null == threadId ? _self.threadId : threadId // ignore: cast_nullable_to_non_nullable
as String,scheduledFor: null == scheduledFor ? _self.scheduledFor : scheduledFor // ignore: cast_nullable_to_non_nullable
as String,status: null == status ? _self.status : status // ignore: cast_nullable_to_non_nullable
as String,
  ));
}


}

// dart format on
